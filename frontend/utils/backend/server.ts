import io, { Socket } from "socket.io-client";
import { createClient } from "../supabase/client";
type ConnectionResult = {
  success: boolean;
  errorMessage: string;
};
const backend_url: string =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4500";

class Server {
  public socket: Socket | null = null;
  private connected: boolean = false;

  public async connect(
    realmId: string,
    uid: string,
    shareId: string,
    access_token: string
  ) {
    this.socket = io(backend_url, {
      reconnection: true,
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      },
      query: {
        uid,
      },
    });
    return new Promise<ConnectionResult>((resolve) => {
      if (!this.socket) {
        resolve({ success: false, errorMessage: "Socket not initialized" });
        return;
      }

      this.socket.connect();

      this.socket.on("connect", () => {
        this.connected = true;
        this.socket.emit("joinRealm", {
          realmId,
          shareId,
        });

        resolve({ success: true, errorMessage: "" });
      });

      this.socket.on("connect_error", (err) => {
        console.error("Connection error:", err.message);
        resolve({ success: false, errorMessage: err.message });
      });

      this.socket.on("disconnect", (reason) => {
        console.warn("Disconnected from server:", reason);
      });

      this.socket.on("reconnect_attempt", (attempt) => {
        console.log(`Reconnection attempt ${attempt}`);
      });

      this.socket.on("reconnect_failed", () => {
        console.error("Reconnection failed");
        resolve({
          success: false,
          errorMessage: "Reconnection failed",
        });
      });
    });
  }
}
const server = new Server();
export { server };
