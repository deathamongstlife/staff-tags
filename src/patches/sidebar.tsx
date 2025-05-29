import { findByProps, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";

const Rows = findByProps("GuildMemberRow");
const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;
const GuildStore = findByStoreName("GuildStore");

export default () => {
    if (!Rows?.GuildMemberRow) {
        return () => {};
    }

    return after("type", Rows.GuildMemberRow, ([{ guildId, channel, user }], ret) => {
        try {
            if (!ret || !user) return ret;
            
            const guild = GuildStore?.getGuild?.(guildId);
            const tag = getTag(guild, channel, user);

            if (tag && TagModule?.default) {
                // Simple approach: just try to add to ret.props.children
                if (ret.props && ret.props.children) {
                    if (Array.isArray(ret.props.children)) {
                        ret.props.children.push(
                            React.createElement(TagModule.default, {
                                type: 0,
                                text: tag.text,
                                textColor: tag.textColor,
                                backgroundColor: tag.backgroundColor,
                                verified: tag.verified
                            })
                        );
                    }
                }
            }
        } catch (error) {
            // Silent
        }
        
        return ret;
    });
};
