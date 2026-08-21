import * as SecureStore from "expo-secure-store";
import { useCredentialsStore } from "../useCredentialsStore";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockedGetItem = SecureStore.getItemAsync as jest.Mock;

function resetStore() {
  useCredentialsStore.setState({ credentials: null, loaded: false, error: null });
}

describe("useCredentialsStore.load", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it("loads stored credentials", async () => {
    const stored = {
      apiKey: "k",
      clientId: "c",
      clientSecret: "s",
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 123,
      systemId: "42",
    };
    mockedGetItem.mockResolvedValue(JSON.stringify(stored));

    await useCredentialsStore.getState().load();

    expect(useCredentialsStore.getState().credentials).toEqual(stored);
    expect(useCredentialsStore.getState().loaded).toBe(true);
    expect(useCredentialsStore.getState().error).toBeNull();
  });

  it("marks loaded when nothing is stored", async () => {
    mockedGetItem.mockResolvedValue(null);

    await useCredentialsStore.getState().load();

    expect(useCredentialsStore.getState().credentials).toBeNull();
    expect(useCredentialsStore.getState().loaded).toBe(true);
  });

  // Regression: a rejected read used to leave `loaded` false forever, which the
  // root layout turned into a permanently blank screen on device.
  it("still marks loaded when secure storage rejects", async () => {
    mockedGetItem.mockRejectedValue(new Error("Keystore unavailable"));

    await expect(useCredentialsStore.getState().load()).resolves.toBeUndefined();

    expect(useCredentialsStore.getState().loaded).toBe(true);
    expect(useCredentialsStore.getState().credentials).toBeNull();
    expect(useCredentialsStore.getState().error).toBe("Keystore unavailable");
  });

  // Same class of failure, different trigger: corrupt JSON in storage.
  it("still marks loaded when stored data is not valid JSON", async () => {
    mockedGetItem.mockResolvedValue("{not json");

    await expect(useCredentialsStore.getState().load()).resolves.toBeUndefined();

    expect(useCredentialsStore.getState().loaded).toBe(true);
    expect(useCredentialsStore.getState().credentials).toBeNull();
    expect(useCredentialsStore.getState().error).not.toBeNull();
  });
});
