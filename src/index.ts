import { storage } from "@vendetta/plugin";
import patchChat from "./patches/chat";
import patchDetails from "./patches/details";
import patchName from "./patches/name";
import patchSidebar from "./patches/sidebar";
import patchTag from "./patches/tag";
import Settings from "./ui/pages/Settings";

let patches = [];

export default {
    onLoad: () => {
        try {
            storage.useRoleColor ??= false;
            
            patches.push(patchChat());
            patches.push(patchTag());
            patches.push(patchName());
            patches.push(patchSidebar());
            patches.push(patchDetails());
            
            console.log("Staff Tags loaded successfully");
        } catch (error) {
            console.error("Staff Tags - Load error:", error);
            throw error;
        }
    },
    onUnload: () => {
        try {
            patches.forEach(unpatch => {
                try {
                    unpatch?.();
                } catch (error) {
                    console.error("Staff Tags - Unpatch error:", error);
                }
            });
            patches = [];
            console.log("Staff Tags unloaded successfully");
        } catch (error) {
            console.error("Staff Tags - Unload error:", error);
        }
    },
    settings: Settings
};
