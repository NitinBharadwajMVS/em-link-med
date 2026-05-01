// ESP32 + External IR obstacle sensor (AO) for Heart Rate
//        + MAX30102 (SpO2 only) on second I2C bus
//        + 16x2 I2C LCD on first I2C bus
//
// Wire  -> LCD (SDA=16, SCL=17)
// Wire1 -> MAX30102 (SDA=21, SCL=22)
// External IR AO -> ADC pin 34
//
// Requirements:
//  - SparkFun MAX3010x Sensor Library (MAX30105.h)
//  - heartRate.h (checkForBeat)
//  - LiquidCrystal_I2C library

// ------------------ Minimal Supabase additions ------------------
// (Do NOT change your main logic below except fill these values)
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// Fill these with your credentials
const char* WIFI_SSID = "Nik";
const char* WIFI_PASS = "12345678";
const char* SUPABASE_URL = "https://ivojlhscsawpuqbejdom.supabase.co"; // no trailing slash
const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2b2psaHNjc2F3cHVxYmVqZG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzcxMDgsImV4cCI6MjA5MTIxMzEwOH0.tiM975H1_z6kdHqHrW8tEvaGf6ZMCC-upr0oIntM6z0"; // prefer anon key
const char* SUPABASE_TABLE = "live_vitals";
const char* DEVICE_ID = "device_001";

const unsigned long UPLOAD_INTERVAL = 5000UL; // upload every 5s (change if you want)
unsigned long lastUpload = 0;
bool wifiConnected = false;
// -----------------------------------------------------------------

#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <LiquidCrystal_I2C.h>

// ------------------ Pin Config ------------------
#define LCD_SDA_PIN 16
#define LCD_SCL_PIN 17
#define SENSOR_SDA_PIN 21
#define SENSOR_SCL_PIN 22
#define IR_SENSOR_PIN 34     // External analog IR sensor AO -> choose analog pin 32-39

// ------------------ LCD Settings ----------------
#define LCD_I2C_ADDR 0x27
#define LCD_COLS 16
#define LCD_ROWS 2
LiquidCrystal_I2C lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS);

// ------------------ MAX30102 on second I2C bus ---
TwoWire I2C_Sensor = TwoWire(1);
MAX30105 particleSensor;

// ------------------ Heart-rate (analog IR) filter params --------------
const int SMA_WINDOW = 6;             // moving-average window (tune)
const float BASELINE_ALPHA = 0.995f;  // baseline lowpass factor (closer to 1 => slower baseline)
const float SCALE_FACTOR = 20.0f;     // scale AC component to units expected by checkForBeat()
int smaBuf[SMA_WINDOW] = {0};
int smaIdx = 0;
bool smaInit = false;
float baseline = 0.0f; // DC baseline for analog IR

// ------------------ Variables ------------------
int beatAvg = 0;
int sp02Avg = 0;
const int SMOOTH_ALPHA = 4; // smoothing factor for BPM & SpO2

unsigned long lastBeatTime = 0;
unsigned long lastPrint = 0;
const unsigned long PRINT_INTERVAL = 500;

// Debugging: set to 1 to print raw values to Serial
#define DEBUG 0

// Keep last MAX readings in globals so upload block can access them (no logic change)
uint32_t g_last_red = 0;
uint32_t g_last_ir = 0;

void setup() {
  Serial.begin(115200);
  delay(50);

  // minimal addition: connect WiFi (non-invasive)
  connectWiFi();

  // --- LCD Bus ---
  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  lcd.begin(LCD_COLS, LCD_ROWS);
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Init sensors...");

  // --- MAX30102 Bus ---
  I2C_Sensor.begin(SENSOR_SDA_PIN, SENSOR_SCL_PIN, 400000);
  if (!particleSensor.begin(I2C_Sensor)) {
    Serial.println("MAX30102 not found! Check wiring.");
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("MAX30102 error!");
    while (1) delay(1000);
  }

  // --- Configure MAX30102 (SpO2 only) ---
  byte ledBrightness = 255;   // 0-255
  byte sampleAverage = 4;     // 1,2,4,8,16,32
  byte ledMode = 2;           // 2 = Red + IR (for SpO2)
  byte sampleRate = 100;      // samples/sec
  int pulseWidth = 411;       // 69,118,215,411 (us)
  int adcRange = 16384;       // 2048,4096,8192,16384

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);

  // Warm start values
  beatAvg = 0;
  sp02Avg = 0;
  baseline = 0.0f;
  smaIdx = 0;
  smaInit = false;

  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Ready...");
  delay(800);
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Place finger...");
  lcd.setCursor(0,1);
  lcd.print("Reading...");
}

// ------------------ Loop ------------------
void loop() {
  // --- 1) HEART RATE via External IR Sensor (AO from obstacle module) ---
  int raw = analogRead(IR_SENSOR_PIN); // 0..4095 on ESP32 by default
  // Moving average (SMA) to reduce spikes
  smaBuf[smaIdx++] = raw;
  if (smaIdx >= SMA_WINDOW) smaIdx = 0;

  long sum = 0;
  int samples = 0;
  for (int i = 0; i < SMA_WINDOW; ++i) {
    if (!smaInit && smaBuf[i] == 0) continue; // skip zeros until buffer full
    sum += smaBuf[i];
    samples++;
  }
  if (samples == SMA_WINDOW) smaInit = true;
  int smoothed = (samples > 0) ? (int)(sum / samples) : raw;

  // Slow baseline tracking (IIR low-pass)
  baseline = BASELINE_ALPHA * baseline + (1.0f - BASELINE_ALPHA) * (float)smoothed;

  // AC component (remove DC)
  float ac = (float)smoothed - baseline;
  float acAbs = fabs(ac);

  // Scale AC to range checkForBeat expects
  long scaled = (long)(acAbs * SCALE_FACTOR);
  if (scaled < 0) scaled = 0;

#if DEBUG
  Serial.print("RAW="); Serial.print(raw);
  Serial.print(" SM="); Serial.print(smoothed);
  Serial.print(" BASE="); Serial.print(baseline, 2);
  Serial.print(" AC="); Serial.print(ac, 2);
  Serial.print(" SCALED="); Serial.println(scaled);
#endif

  // Feed scaled value to checkForBeat()
  if (checkForBeat(scaled)) {
    unsigned long now = millis();
    if (lastBeatTime != 0) {
      unsigned long delta = now - lastBeatTime;
      if (delta > 250 && delta < 2000) { // accept 30-240 BPM
        float instBpm = 60000.0f / (float)delta;
        if (beatAvg == 0) beatAvg = (int)instBpm;
        else beatAvg = (beatAvg * (SMOOTH_ALPHA - 1) + (int)instBpm) / SMOOTH_ALPHA;
      }
    }
    lastBeatTime = now;
  }

  // --- 2) SpO2 via MAX30102 ---
  static uint32_t red = 0, ir = 0;
  if (particleSensor.available()) {
    red = particleSensor.getRed();
    ir = particleSensor.getIR();
    particleSensor.nextSample();

    // Update globals so upload sees latest values (no logic change to processing)
    g_last_red = red;
    g_last_ir = ir;

    // crude SpO2 estimate (simple ratio method)
    float ratio = (ir > 0) ? ((float)red / (float)ir) : 0.0f;
    float SpO2 = 110.0f - 25.0f * ratio;
    if (SpO2 > 100.0f) SpO2 = 99.9f;
    if (SpO2 < 50.0f) SpO2 = 50.0f;

    // smooth SpO2 for display
    if (sp02Avg == 0) sp02Avg = (int)SpO2;
    else sp02Avg = (sp02Avg * (SMOOTH_ALPHA - 1) + (int)SpO2) / SMOOTH_ALPHA;
  } else {
    particleSensor.check(); // request data
  }

  // --- 3) Display + Serial Output ---
  if (millis() - lastPrint >= PRINT_INTERVAL) {
    lastPrint = millis();

    // LCD Display
    lcd.clear();
    lcd.setCursor(0, 0);
    char line1[17];
    snprintf(line1, sizeof(line1), "HR:%3d BPM", beatAvg);
    lcd.print(line1);
    lcd.setCursor(0, 1);
    char line2[17];
    snprintf(line2, sizeof(line2), "SpO2:%3d%%", sp02Avg);
    lcd.print(line2);

    // Serial log for debugging/tuning
    Serial.print("Analog RAW="); Serial.print(raw);
    Serial.print(" SM="); Serial.print(smoothed);
    Serial.print(" BASE="); Serial.print(baseline, 2);
    Serial.print(" SCALED="); Serial.print(scaled);
    Serial.print(" | MAX_IR="); Serial.print(g_last_ir);
    Serial.print(" MAX_RED="); Serial.print(g_last_red);
    Serial.print(" | HR="); Serial.print(beatAvg);
    Serial.print(" | SpO2="); Serial.println(sp02Avg);
  }

  // ----------------- Minimal non-invasive upload block -----------------
  // This uploads constantly (every UPLOAD_INTERVAL) regardless of finger presence.
  if (wifiConnected && (millis() - lastUpload >= UPLOAD_INTERVAL)) {
    lastUpload = millis();

    // Build JSON payload matching live_vitals table: device_id, hr_bpm, spo2_pct
    String payload = "{";
    payload += "\"device_id\": \"" + String(DEVICE_ID) + "\",";
    payload += "\"hr_bpm\": " + String(beatAvg) + ",";
    payload += "\"spo2_pct\": " + String(sp02Avg);
    payload += "}";

    bool ok = sendToSupabase_debug(payload);
    if (ok) {
      Serial.println("Supabase upload OK");
    } else {
      Serial.println("Supabase upload FAILED");
    }
  }
  // ---------------------------------------------------------------------

  delay(2); // small yield
}

// ---------------- WiFi connect helper (minimal) ----------------
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(250);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected, IP: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
  } else {
    Serial.println();
    Serial.println("WiFi connect failed");
    wifiConnected = false;
  }
}

// ---------------- Supabase upload helper (minimal) ----------------
// POST https://<project>.supabase.co/rest/v1/live_vitals
// Headers: apikey, Authorization: Bearer <key>, Content-Type: application/json
// DEBUG sendToSupabase with verbose logging
bool sendToSupabase_debug(const String &jsonPayload) {
  Serial.println("--- sendToSupabase_debug START ---");
  if (!wifiConnected) {
    Serial.println("WiFi not connected!");
    Serial.println("--- sendToSupabase_debug END ---");
    return false;
  }

  String url = String(SUPABASE_URL) + "/rest/v1/" + SUPABASE_TABLE;
  Serial.print("URL: "); Serial.println(url);
  Serial.print("Payload: "); Serial.println(jsonPayload);

  WiFiClientSecure client;
  client.setInsecure(); // for prototyping
  HTTPClient https;

  bool success = false;
  if (!https.begin(client, url)) {
    Serial.println("https.begin() failed");
    Serial.println("--- sendToSupabase_debug END ---");
    return false;
  }

  // Headers
  https.addHeader("Content-Type", "application/json");
  https.addHeader("apikey", SUPABASE_KEY);
  String authHeader = "Bearer ";
  authHeader += SUPABASE_KEY;
  https.addHeader("Authorization", authHeader);
  // ask for representation so response body contains created row on success
 https.addHeader("Prefer", "resolution=merge-duplicates,return=minimal");


  Serial.println("POSTing...");
  int httpCode = https.POST(jsonPayload);
  Serial.print("httpCode = "); Serial.println(httpCode);

  if (httpCode > 0) {
    String resp = https.getString();
    Serial.print("Response body: "); Serial.println(resp);
    // 201 = created
    if (httpCode == 201 || httpCode == 200) {
      Serial.println("Insert appears successful.");
      success = true;
    } else {
      Serial.print("Server returned code "); Serial.print(httpCode);
      Serial.println(" (not 200/201). Check payload and table / RLS policies.");
    }
  } else {
    Serial.print("HTTP POST failed, error: ");
    Serial.println(https.errorToString(httpCode));
    Serial.println("Possible causes: network, TLS, URL, blocked port.");
  }

  https.end();
  Serial.println("--- sendToSupabase_debug END ---");
  return success;
}

// One-shot test helper (call once in setup to verify)
void testUpload() {
  // example minimal payload (adjust device_id if you want)
  String payload = "{";
  payload += "\"device_id\": \"test_device\",";
  payload += "\"hr_bpm\": 55,";
  payload += "\"spo2_pct\": 98";
  payload += "}";
  bool ok = sendToSupabase_debug(payload);
  if (ok) Serial.println("testUpload: OK");
  else Serial.println("testUpload: FAILED");
}