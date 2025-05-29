import { findByProps, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import getTag from "../lib/getTag";

const Rows = findByProps("GuildMemberRow");
const TagModule = findByProps("getBotLabel");
const GuildStore = findByStoreName("GuildStore");

export default () => {
    const patches = [];
    
    // Try GuildMemberRow
    if (Rows?.GuildMemberRow) {
        patches.push(after("type", Rows.GuildMemberRow, ([{ guildId, channel, user }], ret) => {
            try {
                if (!ret || !user) return ret;
                
                const guild = GuildStore?.getGuild?.(guildId);
                const tag = getTag(guild, channel, user);

                if (tag && TagModule?.default && ret.props?.children) {
                    // Try to add tag with [SIDEBAR] marker
                    const tagElement = React.createElement(TagModule.default, {
                        type: 0,
                        text: tag.text + "[SIDEBAR]", // Marker to see if it worked
                        textColor: tag.textColor,
                        backgroundColor: tag.backgroundColor,
                        verified: tag.verified
                    });
                    
                    if (Array.isArray(ret.props.children)) {
                        ret.props.children.push(tagElement);
                    } else {
                        ret.props.children = [ret.props.children, tagElement];
                    }
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
