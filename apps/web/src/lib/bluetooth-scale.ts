// ---------------------------------------------------------------------------
// Bluetooth Scale Integration — Web Bluetooth API
// ---------------------------------------------------------------------------
// Supports BLE scales using the GATT Weight Measurement characteristic
// (UUID 0x2A9D) from the Weight Scale Service (UUID 0x181D).
// ---------------------------------------------------------------------------

export type WeightUnit = "kg" | "g" | "lb";

export interface WeightReading {
  value: number;
  unit: WeightUnit;
  stable: boolean;
  timestamp: number;
}

export interface ScaleConnection {
  device: BluetoothDevice;
  disconnect: () => void;
}

// GATT UUIDs
const WEIGHT_SCALE_SERVICE = 0x181d;
const WEIGHT_MEASUREMENT_CHAR = 0x2a9d;

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

/**
 * Check if Web Bluetooth is available in the current browser.
 */
export function isBluetoothAvailable(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

/**
 * Request and connect to a BLE weight scale.
 * Shows the browser's Bluetooth device picker.
 */
export async function connectScale(): Promise<BluetoothDevice> {
  if (!isBluetoothAvailable()) {
    throw new Error(
      "Web Bluetooth wird von diesem Browser nicht unterstützt. Bitte verwenden Sie Google Chrome."
    );
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [WEIGHT_SCALE_SERVICE] }],
    optionalServices: [WEIGHT_SCALE_SERVICE],
  });

  if (!device.gatt) {
    throw new Error("Bluetooth GATT ist auf diesem Gerät nicht verfügbar.");
  }

  await device.gatt.connect();
  return device;
}

/**
 * Disconnect from a BLE scale.
 */
export function disconnectScale(device: BluetoothDevice): void {
  if (device.gatt?.connected) {
    device.gatt.disconnect();
  }
}

// ---------------------------------------------------------------------------
// Weight reading
// ---------------------------------------------------------------------------

/**
 * Parse a Weight Measurement characteristic value (UUID 0x2A9D).
 * See: https://www.bluetooth.com/specifications/gatt/characteristics/
 *
 * Byte 0: Flags
 *   Bit 0: 0 = SI (kg), 1 = Imperial (lb)
 *   Bit 1: Time Stamp present
 *   Bit 2: User ID present
 *   Bit 3: BMI and Height present
 *   Bit 4: Measurement Unstable
 *
 * Bytes 1-2: Weight (uint16, in units of 0.005 kg or 0.01 lb)
 */
function parseWeightMeasurement(dataView: DataView): WeightReading {
  const flags = dataView.getUint8(0);
  const isImperial = (flags & 0x01) !== 0;
  const isUnstable = (flags & 0x10) !== 0;

  // Weight is stored as a uint16 at offset 1 (little-endian)
  const rawWeight = dataView.getUint16(1, true);

  let value: number;
  let unit: WeightUnit;

  if (isImperial) {
    // Imperial: resolution 0.01 lb
    value = rawWeight * 0.01;
    unit = "lb";
  } else {
    // SI: resolution 0.005 kg
    value = rawWeight * 0.005;
    unit = "kg";
  }

  // Convert to grams if under 1 kg for better readability
  if (unit === "kg" && value < 1 && value > 0) {
    value = value * 1000;
    unit = "g";
  }

  return {
    value: Math.round(value * 100) / 100, // 2 decimal places
    unit,
    stable: !isUnstable,
    timestamp: Date.now(),
  };
}

/**
 * Read the current weight from a connected BLE scale (single read).
 */
export async function readWeight(device: BluetoothDevice): Promise<WeightReading> {
  if (!device.gatt?.connected) {
    throw new Error("Waage ist nicht verbunden.");
  }

  const server = device.gatt;
  const service = await server.getPrimaryService(WEIGHT_SCALE_SERVICE);
  const characteristic = await service.getCharacteristic(WEIGHT_MEASUREMENT_CHAR);

  const value = await characteristic.readValue();
  return parseWeightMeasurement(value);
}

/**
 * Subscribe to weight changes from a connected BLE scale.
 * Returns an unsubscribe function.
 */
export async function onWeightChange(
  device: BluetoothDevice,
  callback: (reading: WeightReading) => void
): Promise<() => void> {
  if (!device.gatt?.connected) {
    throw new Error("Waage ist nicht verbunden.");
  }

  const server = device.gatt;
  const service = await server.getPrimaryService(WEIGHT_SCALE_SERVICE);
  const characteristic = await service.getCharacteristic(WEIGHT_MEASUREMENT_CHAR);

  const handler = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (target.value) {
      const reading = parseWeightMeasurement(target.value);
      callback(reading);
    }
  };

  characteristic.addEventListener("characteristicvaluechanged", handler);
  await characteristic.startNotifications();

  return () => {
    characteristic.removeEventListener("characteristicvaluechanged", handler);
    characteristic.stopNotifications().catch(() => {});
  };
}

// ---------------------------------------------------------------------------
// Device event helpers
// ---------------------------------------------------------------------------

/**
 * Listen for device disconnection.
 * Returns an unsubscribe function.
 */
export function onDisconnect(
  device: BluetoothDevice,
  callback: () => void
): () => void {
  const handler = () => callback();
  device.addEventListener("gattserverdisconnected", handler);
  return () => {
    device.removeEventListener("gattserverdisconnected", handler);
  };
}
