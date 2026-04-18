import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";

import { scanMedicationImage } from "./src/lib/scan-client";
import type { MedicationScanResponse } from "./src/types/scan";

const DEFAULT_API_URL = process.env.EXPO_PUBLIC_SCAN_API_URL ?? "http://localhost:3001";

export default function App() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_URL);
  const [hint, setHint] = useState("pharmacy bottle label");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<MedicationScanResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function pickImage() {
    setErrorMessage(null);

    const result = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      multiple: false,
      copyToCacheDirectory: false,
      base64: true
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const dataUrl = await getImageDataUrl(asset);

    setSelectedImageUri(asset.uri);
    setSelectedImageName(asset.name);
    setSelectedImageDataUrl(dataUrl);
    setScanResult(null);
  }

  async function submitScan() {
    if (!selectedImageDataUrl) {
      setErrorMessage("Pick an image first so the tester has something to send.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const result = await scanMedicationImage({
        apiBaseUrl,
        imageBase64DataUrl: selectedImageDataUrl,
        hint
      });

      setScanResult(result);
    } catch (error) {
      setScanResult(null);
      setErrorMessage(error instanceof Error ? error.message : "Scan failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function resetAll() {
    setSelectedImageUri(null);
    setSelectedImageName(null);
    setSelectedImageDataUrl(null);
    setScanResult(null);
    setErrorMessage(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f1e7" }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#f8f1e7"
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: 999,
          backgroundColor: "rgba(198, 87, 45, 0.18)"
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -80,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: 999,
          backgroundColor: "rgba(226, 171, 72, 0.24)"
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 28,
          paddingBottom: 48,
          gap: 18
        }}
      >
        <View
          style={{
            gap: 10,
            maxWidth: 760
          }}
        >
          <Text
            selectable
            style={{
              fontSize: 40,
              lineHeight: 44,
              fontWeight: "800",
              color: "#2d1b12",
              letterSpacing: -1.2
            }}
          >
            Medication Scan Test
          </Text>
          <Text
            selectable
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: "#5e4638",
              maxWidth: 720
            }}
          >
            Upload a downloaded image of a bottle, box, blister pack, or printed label. The app sends it to the scan
            backend, shows the extracted packaging text, and lists the RxNav match candidates before anything would be
            saved.
          </Text>
        </View>

        <View
          style={{
            flexDirection: isWide ? "row" : "column",
            gap: 18,
            alignItems: "stretch"
          }}
        >
          <View
            style={{
              flex: 1.05,
              gap: 16,
              padding: 18,
              borderRadius: 28,
              borderCurve: "continuous",
              backgroundColor: "rgba(255, 250, 245, 0.92)",
              boxShadow: "0 14px 50px rgba(76, 39, 16, 0.08)"
            }}
          >
            <SectionTitle title="Upload" />

            <LabeledField label="Backend URL">
              <TextInput
                value={apiBaseUrl}
                onChangeText={setApiBaseUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="http://localhost:3001"
                style={inputStyle}
              />
            </LabeledField>

            <LabeledField label="Optional hint">
              <TextInput
                value={hint}
                onChangeText={setHint}
                placeholder="pharmacy bottle label"
                style={inputStyle}
              />
            </LabeledField>

            <View
              style={{
                minHeight: 280,
                borderRadius: 24,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#e1c9b3",
                backgroundColor: "#fff8f1",
                padding: 16,
                gap: 14,
                justifyContent: "center"
              }}
            >
              {selectedImageUri ? (
                <>
                  <Image
                    source={{ uri: selectedImageUri }}
                    resizeMode="contain"
                    style={{
                      width: "100%",
                      height: 220,
                      borderRadius: 18,
                      backgroundColor: "#f3e7db"
                    }}
                  />
                  <Text selectable style={metaStyle}>
                    Selected file: {selectedImageName ?? "Unnamed image"}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    selectable
                    style={{
                      textAlign: "center",
                      fontSize: 22,
                      lineHeight: 28,
                      fontWeight: "700",
                      color: "#6c4d39"
                    }}
                  >
                    No image selected yet
                  </Text>
                  <Text selectable style={{ textAlign: "center", fontSize: 15, lineHeight: 22, color: "#7a5a45" }}>
                    Pick a clear screenshot or photo of medication packaging and this tester will send it as a base64
                    image payload.
                  </Text>
                </>
              )}
            </View>

            <View
              style={{
                flexDirection: isWide ? "row" : "column",
                gap: 12
              }}
            >
              <ActionButton label="Pick image" onPress={pickImage} tone="warm" disabled={isUploading} />
              <ActionButton
                label={isUploading ? "Scanning..." : "Run scan"}
                onPress={submitScan}
                tone="dark"
                disabled={isUploading || !selectedImageDataUrl}
              />
              <ActionButton label="Reset" onPress={resetAll} tone="light" disabled={isUploading} />
            </View>

            {isUploading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#8f3a1e" />
                <Text selectable style={metaStyle}>
                  Sending image to {apiBaseUrl}
                </Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View
                style={{
                  padding: 14,
                  borderRadius: 18,
                  borderCurve: "continuous",
                  backgroundColor: "#ffe5dd",
                  borderWidth: 1,
                  borderColor: "#f2b5a0"
                }}
              >
                <Text selectable style={{ color: "#8f2d12", fontSize: 14, lineHeight: 22 }}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={{
              flex: 1,
              gap: 16,
              padding: 18,
              borderRadius: 28,
              borderCurve: "continuous",
              backgroundColor: "#2f1c13",
              boxShadow: "0 14px 50px rgba(76, 39, 16, 0.18)"
            }}
          >
            <SectionTitle title="Scan result" light />

            {scanResult ? (
              <>
                <ResultTile
                  label="Packaging confidence"
                  value={`${scanResult.extraction.confidence} / ${scanResult.extraction.packagingType}`}
                />
                <ResultTile
                  label="Extracted medication"
                  value={scanResult.extraction.medicationName ?? "No medication name extracted"}
                />
                <ResultTile label="Match status" value={scanResult.match.status} />
                <ResultTile label="Reason" value={scanResult.match.reason} />

                <View style={{ gap: 8 }}>
                  <SubtleHeading light>Visible text</SubtleHeading>
                  <Text selectable style={lightBodyStyle}>
                    {scanResult.extraction.visibleText.length > 0
                      ? scanResult.extraction.visibleText.join(" | ")
                      : "No readable label text returned"}
                  </Text>
                </View>

                <View style={{ gap: 10 }}>
                  <SubtleHeading light>Top candidates</SubtleHeading>
                  {scanResult.match.candidates.length > 0 ? (
                    scanResult.match.candidates.slice(0, 5).map((candidate) => (
                      <View
                        key={`${candidate.rxcui}-${candidate.rank}`}
                        style={{
                          gap: 6,
                          padding: 14,
                          borderRadius: 18,
                          borderCurve: "continuous",
                          backgroundColor: "rgba(255, 245, 237, 0.08)",
                          borderWidth: 1,
                          borderColor: "rgba(255, 228, 208, 0.16)"
                        }}
                      >
                        <Text selectable style={{ color: "#fff4ec", fontSize: 16, fontWeight: "700" }}>
                          {candidate.displayName}
                        </Text>
                        <Text selectable style={lightMetaStyle}>
                          RXCUI {candidate.rxcui} | rank {candidate.rank} | score {candidate.confidenceScore.toFixed(2)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text selectable style={lightBodyStyle}>
                      No RxNav candidates returned yet.
                    </Text>
                  )}
                </View>

                <View style={{ gap: 8 }}>
                  <SubtleHeading light>Raw JSON</SubtleHeading>
                  <View
                    style={{
                      borderRadius: 20,
                      borderCurve: "continuous",
                      backgroundColor: "#1f120c",
                      padding: 14
                    }}
                  >
                    <Text
                      selectable
                      style={{
                        color: "#f9dcc8",
                        fontSize: 13,
                        lineHeight: 20,
                        fontFamily: "Courier"
                      }}
                    >
                      {JSON.stringify(scanResult, null, 2)}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View
                style={{
                  minHeight: 420,
                  justifyContent: "center",
                  gap: 10
                }}
              >
                <Text selectable style={{ color: "#fff4ec", fontSize: 24, fontWeight: "800" }}>
                  Waiting for a test image
                </Text>
                <Text selectable style={lightBodyStyle}>
                  Once you run a scan, this panel will show the extracted label fields, the matching status, and the
                  RxNav candidates that the user should confirm.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}

function ActionButton({
  disabled,
  label,
  onPress,
  tone
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void | Promise<void>;
  tone: "warm" | "dark" | "light";
}) {
  const tones = {
    warm: {
      backgroundColor: "#c95b2a",
      borderColor: "#c95b2a",
      textColor: "#fff8f1"
    },
    dark: {
      backgroundColor: "#2f1c13",
      borderColor: "#2f1c13",
      textColor: "#fff8f1"
    },
    light: {
      backgroundColor: "#fff7ef",
      borderColor: "#d6baa2",
      textColor: "#5a4133"
    }
  } satisfies Record<string, { backgroundColor: string; borderColor: string; textColor: string }>;

  const selectedTone = tones[tone];

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        void onPress();
      }}
      style={({ pressed }) => ({
        flex: tone === "light" ? 0 : 1,
        minHeight: 54,
        borderRadius: 18,
        borderCurve: "continuous",
        paddingHorizontal: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: disabled ? "#d5c8bb" : selectedTone.backgroundColor,
        borderWidth: 1,
        borderColor: disabled ? "#d5c8bb" : selectedTone.borderColor,
        opacity: pressed ? 0.88 : 1
      })}
    >
      <Text
        selectable
        style={{
          color: disabled ? "#8c7769" : selectedTone.textColor,
          fontSize: 15,
          fontWeight: "800"
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SectionTitle({ light, title }: { light?: boolean; title: string }) {
  return (
    <Text
      selectable
      style={{
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "800",
        color: light ? "#fff4ec" : "#311d14"
      }}
    >
      {title}
    </Text>
  );
}

function SubtleHeading({ light, children }: { light?: boolean; children: string }) {
  return (
    <Text
      selectable
      style={{
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "800",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: light ? "#d7b4a2" : "#9c6a4d"
      }}
    >
      {children}
    </Text>
  );
}

function LabeledField({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <SubtleHeading>{label}</SubtleHeading>
      {children}
    </View>
  );
}

function ResultTile({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        gap: 6,
        padding: 14,
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: "rgba(255, 245, 237, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(255, 228, 208, 0.16)"
      }}
    >
      <SubtleHeading light>{label}</SubtleHeading>
      <Text selectable style={{ color: "#fff4ec", fontSize: 16, lineHeight: 24, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}

const inputStyle = {
  minHeight: 52,
  borderRadius: 18,
  borderCurve: "continuous" as const,
  borderWidth: 1,
  borderColor: "#d8b89d",
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: "#fffdf9",
  color: "#2b1911",
  fontSize: 15
};

const metaStyle = {
  color: "#6c5546",
  fontSize: 13,
  lineHeight: 20
};

const lightMetaStyle = {
  color: "#d9b8a7",
  fontSize: 13,
  lineHeight: 20
};

const lightBodyStyle = {
  color: "#f7e6db",
  fontSize: 15,
  lineHeight: 24
};

async function getImageDataUrl(asset: DocumentPicker.DocumentPickerAsset) {
  if (asset.file) {
    return readFileAsDataUrl(asset.file);
  }

  if (asset.base64) {
    const normalized = asset.base64.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (normalized.length % 4)) % 4;
    return `data:${asset.mimeType ?? "image/jpeg"};base64,${normalized}${"=".repeat(padLength)}`;
  }

  const response = await fetch(asset.uri);

  if (!response.ok) {
    throw new Error(`Failed to load the selected image from ${asset.uri}.`);
  }

  const blob = await response.blob();
  return readFileAsDataUrl(blob);
}

function readFileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("The selected file could not be converted into a data URL."));
    };

    reader.onerror = () => {
      reject(new Error("The selected file could not be read."));
    };

    reader.readAsDataURL(file);
  });
}
