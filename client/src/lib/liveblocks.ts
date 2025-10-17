import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { UserPresence } from "../types";
import { api } from "./api";

const client = createClient({
  authEndpoint: async (room) => {
    return api.liveblocksAuth(room);
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
