import { findByProps, findByStoreName, findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import getTag from "../lib/getTag";

const TagModule = findByProps("getBotLabel");
const GuildStore = findByStoreName("GuildStore");

// Try to find different possible components
const MemberListItem = findByName("MemberListItem", false);
const VoiceUser = findByName("VoiceUser", false);
const Member = findByName("Member", false);
const ConnectedMember = findByName("ConnectedMember", false);

export default () => {
    const patches = [];
    
    const addTag = (componentName) => ([props], ret) => {
        try {
            const { guildId, channel, user } = props || {};
            
            if (!ret || !user) return ret;
            
            const guild = GuildStore?.getGuild?.(guildId);
            const tag = getTag(guild, channel, user);

            if (tag && TagModule?.default) {
                const tagElement = React.createElement(TagModule.default, {
                    type: 0,
                    text: tag.text + `[${componentName}]`, // Visual marker
                    textColor: tag.textColor,
                    backgroundColor: tag.backgroundColor,
                    verified: tag.verified
                });
                
                // Try to add to children
                if (ret.props?.children) {
                    if (Array.isArray(ret.props.children)) {
                        ret.props.children.push(tagElement);
                    } else {
                        ret.props.children = [ret.props.children, tagElement];
                    }
                }
            }
        } catch (error) {
            // Silent
        }
        return ret;
    };

    // Try each component
    if (MemberListItem) {
        patches.push(after("default", MemberListItem, addTag("MemberListItem")));
    }
    
    if (VoiceUser) {
        patches.push(after("default", VoiceUser, addTag("VoiceUser")));
    }
    
    if (Member) {
        patches.push(after("default", Member, addTag("Member")));
    }
    
    if (ConnectedMember) {
        patches.push(after("default", ConnectedMember, addTag("ConnectedMember")));
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
