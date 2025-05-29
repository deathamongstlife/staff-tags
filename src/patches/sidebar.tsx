import { findByProps, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { showToast } from "@vendetta/ui/toasts";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";

const Rows = findByProps("GuildMemberRow");
const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;
const GuildStore = findByStoreName("GuildStore");

let debugCount = 0;

export default () => {
    // Check if components are found
    if (!Rows?.GuildMemberRow) {
        showToast("❌ GuildMemberRow not found", showToast.Kind.FAILURE);
        return () => {};
    }
    
    if (!TagModule?.default) {
        showToast("❌ TagModule not found", showToast.Kind.FAILURE);
        return () => {};
    }

    showToast("✅ Sidebar patch loaded", showToast.Kind.SUCCESS);

    return after("type", Rows.GuildMemberRow, ([{ guildId, channel, user }], ret) => {
        try {
            debugCount++;
            
            // Only debug first few calls to avoid spam
            if (debugCount <= 5) {
                showToast(`🔍 Processing: ${user?.username || 'unknown'}`, showToast.Kind.INFO);
            }
            
            if (!ret || !getBotLabel || !user) {
                if (debugCount <= 5) {
                    showToast("⚠️ Missing data", showToast.Kind.FAILURE);
                }
                return ret;
            }
            
            const guild = GuildStore?.getGuild?.(guildId);
            const tag = getTag(guild, channel, user);
            
            if (tag) {
                if (debugCount <= 5) {
                    showToast(`🏷️ Tag found: ${tag.text}`, showToast.Kind.SUCCESS);
                }
                
                const tagComponent = findInReactTree(ret, (c) => c?.type?.Types);
                
                if (!tagComponent || !BUILT_IN_TAGS.includes(getBotLabel(tagComponent.props?.type))) {
                    if (tagComponent) {
                        tagComponent.props = {
                            type: 0,
                            ...tag
                        };
                        if (debugCount <= 5) {
                            showToast("✏️ Updated existing tag", showToast.Kind.INFO);
                        }
                    } else {
                        // Try to find insertion point
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
                            if (debugCount <= 5) {
                                showToast("➕ Added tag to member", showToast.Kind.SUCCESS);
                            }
                        } else {
                            if (debugCount <= 5) {
                                showToast("❌ No insertion point found", showToast.Kind.FAILURE);
                            }
                        }
                    }
                }
            } else {
                if (debugCount <= 5) {
                    showToast(`ℹ️ No tag for ${user.username}`, showToast.Kind.INFO);
                }
            }
        } catch (error) {
            showToast(`💥 Error: ${error.message}`, showToast.Kind.FAILURE);
        }
        
        return ret;
    });
};
