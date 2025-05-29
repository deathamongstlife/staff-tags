import { findByProps, findByStoreName, findByTypeNameAll } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";

const Rows = findByProps("GuildMemberRow");
const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;
const GuildStore = findByStoreName("GuildStore");

export default () => {
    const patches = [];
    
    console.log("Staff Tags - Sidebar patch setup:", {
        hasRows: !!Rows?.GuildMemberRow,
        hasTagModule: !!TagModule?.default,
        hasBotLabel: !!getBotLabel,
        hasGuildStore: !!GuildStore
    });

    // Try to find all possible member row components
    const memberRowComponents = [
        Rows?.GuildMemberRow,
        ...findByTypeNameAll("GuildMemberRow"),
        ...findByTypeNameAll("MemberRow"),
        ...findByTypeNameAll("UserRow").filter(c => c.name?.includes("Member"))
    ].filter(Boolean);

    console.log("Staff Tags - Found member row components:", memberRowComponents.length);

    memberRowComponents.forEach((Component, index) => {
        try {
            console.log(`Staff Tags - Patching component ${index}:`, Component.name || Component.displayName || "Unknown");
            
            patches.push(after("type", Component, ([props], ret) => {
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
                                // Try multiple strategies to find where to insert the tag
                                const strategies = [
                                    // Strategy 1: Look for flexDirection row
                                    () => findInReactTree(ret, (c) => c?.props?.style?.flexDirection === "row"),
                                    // Strategy 2: Look for any container with children array
                                    () => findInReactTree(ret, (c) => Array.isArray(c?.props?.children) && c.props.children.length > 1),
                                    // Strategy 3: Look for the main content container
                                    () => findInReactTree(ret, (c) => c?.props?.children && !c.type?.Types)
                                ];

                                for (let i = 0; i < strategies.length; i++) {
                                    const container = strategies[i]();
                                    if (container?.props?.children && Array.isArray(container.props.children)) {
                                        console.log(`Staff Tags - Using strategy ${i + 1} for ${user.username}`);
                                        container.props.children.push(
                                            React.createElement(TagModule.default, {
                                                type: 0,
                                                text: tag.text,
                                                textColor: tag.textColor,
                                                backgroundColor: tag.backgroundColor,
                                                verified: tag.verified
                                            })
                                        );
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error("Staff Tags - Member row patch error:", error);
                }
                
                return ret;
            }));
        } catch (error) {
            console.error(`Staff Tags - Failed to patch component ${index}:`, error);
        }
    });

    if (patches.length === 0) {
        console.warn("Staff Tags - No member row components found to patch");
    }

    return () => {
        patches.forEach((unpatch) => {
            try {
                unpatch?.();
            } catch (error) {
                console.error("Staff Tags - Sidebar unpatch error:", error);
            }
        });
    };
};
