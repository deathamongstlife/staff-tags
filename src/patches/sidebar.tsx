import { findByName, findByStoreName } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import getTag from "../lib/getTag";

const RowManager = findByName("RowManager");
const GuildStore = findByStoreName("GuildStore");

export default () => {
    if (!RowManager) {
        return () => {};
    }

    return before("generate", RowManager.prototype, ([data]) => {
        try {
            // Check if this is a member list row with user data
            if (data?.message?.author || data?.user) {
                const user = data.message?.author || data.user;
                const guildId = data.guildId || data.message?.guild_id;
                
                if (user && guildId) {
                    const guild = GuildStore?.getGuild?.(guildId);
                    const tag = getTag(guild, null, user);
                    
                    if (tag) {
                        // Modify the data before it gets rendered
                        if (data.text) {
                            data.text = data.text + ` ${tag.text}`;
                        }
                        
                        // Try to add role styling
                        if (tag.backgroundColor && data.roleStyle !== undefined) {
                            data.roleStyle = tag.backgroundColor;
                        }
                    }
                }
            }
        } catch (error) {
            // Silent
        }
    });
};
