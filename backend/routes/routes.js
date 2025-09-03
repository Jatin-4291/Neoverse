import { Router } from "express";
import { sessionManager } from "../session.js";
import { supabase } from "../supabase.js";
const router = Router();
router.get("/getPlayersInRoom", async (req, res) => {
  const access_token = req.headers.authorization?.split(" ")[1];

  if (!access_token) {
    return res.status(401).json({ message: "No access token provided" });
  }

  const params = req.query;

  const { data: user, error: error } = await supabase.auth.getUser(
    access_token
  );
  if (error) {
    return res.status(401).json({ message: "Invalid access token" });
  }

  const session = sessionManager.getPlayerSession(user.user.id);

  if (!session) {
    return res.status(400).json({ message: "User not in a realm." });
  }

  const players = session.getPlayersInRoom(params.roomIndex);

  return res.json({ players });
});
export default router;
