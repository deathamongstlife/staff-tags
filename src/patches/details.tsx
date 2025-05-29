import { findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import getTag from "../lib/getTag";

const TagModule = findByProps("getBotLabel");
const GuildStore = findByStoreName("GuildStore");

// Use the same components as the platform indicators plugin
const DefaultName = findByName("DefaultName", false);
const DisplayName = findByName("DisplayName", false);

export default () => {
    const patches = [];

    // Patch DefaultName (same pattern as platform indicators)
    if (DefaultName) {
        patches.push(after("default", DefaultName, ([props], ret) => {
            try {
                const user = props?.user;
                const guildId = props?.guildId;
                
                if (!user || !ret) return ret;
                
                const guild = GuildStore?.getGuild?.(guildId);
                const tag = getTag(guild, null, user);

                if (tag && TagModule?.default) {
                    ret.props?.children[0]?.props?.children?.push(
                        <TagModule.default
                            type={0}
                            text={tag.text + "[DEFAULT]"}
                            textColor={tag.textColor}
                            backgroundColor={tag.backgroundColor}
                            verified={tag.verified}
                        />
                    );
                }
            } catch (error) {
                // Silent
            }
            
            return ret;
        }));
    }

    // Patch DisplayName (same pattern as platform indicators)  
    if (DisplayName) {
        patches.push(after("default", DisplayName, ([props], ret) => {
            try {
                const user = props?.user;
                const guildId = props?.guildId;
                
                if (!user || !ret) return ret;
                
                const guild = GuildStore?.getGuild?.(guildId);
                const tag = getTag(guild, null, user);

                if (tag && TagModule?.default) {
                    ret.props?.children?.props?.children[0]?.props?.children?.push(
                        <TagModule.default
                            type={0}
                            text={tag.text + "[DISPLAY]"}
                            textColor={tag.textColor}
                            backgroundColor={tag.backgroundColor}
                            verified={tag.verified}
                        />
                    );
                }
            } catch (error) {
                // Silent
            }
            
            return ret;
        }));
    }

    return () => {
        patches.forEach(unpatch => {
            try {
                unpatch?.();
            } catch (error) {
                // Silent
            }
        });
    };
};
