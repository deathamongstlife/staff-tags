import { findByProps, findByStoreName, findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";

const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;
const GuildStore = findByStoreName("GuildStore");

// Try to find different member list components
const GuildMemberRow = findByProps("GuildMemberRow")?.GuildMemberRow;
const MemberListItem = findByName("MemberListItem", false);
const VoiceUser = findByName("VoiceUser", false);

export default () => {
    const patches = [];

    // Helper function to add tag
    const addTagToMember = ([props], ret) => {
        try {
            const { guildId, channel, user } = props || {};
            
            if (!ret || !getBotLabel || !user) return ret;
            
            const tagComponent = findInReactTree(ret, (c) => c?.type?.Types);
            if (!tagComponent || !BUILT_IN_TAGS.includes(getBotLabel(tagComponent.props?.type))) {
                const guild = GuildStore?.getGuild?.(guildId);
                const tag = getTag(guild, channel, user);

                if (tag && TagModule?.default) {
                    if (tagComponent) {
                        tagComponent.props = {
                            type: 0,
                            ...tag
                        };
                    } else {
                        // Try multiple strategies to find insertion point
                        let inserted = false;
                        
                        // Strategy 1: flexDirection row
                        const row = findInReactTree(ret, (c) => c?.props?.style?.flexDirection === "row");
                        if (row?.props?.children && Array.isArray(row.props.children)) {
                            row.props.children.push(
                                React.createElement(TagModule.default, {
                                    type: 0,
                                    text: tag.text,
                                    textColor: tag.textColor,
                                    backgroundColor: tag.backgroundColor,
                                    verified: tag.verified
                                })
                            );
                            inserted = true;
                        }
                        
                        // Strategy 2: any children array
                        if (!inserted) {
                            const container = findInReactTree(ret, (c) => 
                                Array.isArray(c?.props?.children) && c.props.children.length > 0
                            );
                            if (container?.props?.children) {
                                container.props.children.push(
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
                }
            }
        } catch (error) {
            // Silent error
        }
        
        return ret;
    };

    // Patch all possible components
    if (GuildMemberRow) {
        patches.push(after("type", GuildMemberRow, addTagToMember));
    }
    
    if (MemberListItem) {
        patches.push(after("default", MemberListItem, addTagToMember));
    }
    
    if (VoiceUser) {
        patches.push(after("default", VoiceUser, addTagToMember));
    }

    return () => {
        patches.forEach(unpatch => {
            try {
                unpatch?.();
            } catch (error) {
                // Silent error
            }
        });
    };
};
