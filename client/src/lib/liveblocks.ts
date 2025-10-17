import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { UserPresence } from "../types";
import { api } from "./api";

const client = createClient({
  authEndpoint: async (room) => {
    const userId =
      localStorage.getItem("odyssey-user-id") ||
      `user-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("odyssey-user-id", userId);

    return api.liveblocksAuth(room, userId);
  },
});

type Presence = UserPresence;

type Storage = {
  [key: string]: any;
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    color: string;
  };
};

export const {
  suspense: {
    RoomProvider,
    useRoom,
    useMyPresence,
    useOthers,
    useSelf,
    useStorage,
    useMutation,
  },
} = createRoomContext<Presence, Storage, UserMeta>(client);
