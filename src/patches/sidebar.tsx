import { findByProps, findByStoreName, findByName, findByTypeNameAll } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";

const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;
const GuildStore = findByStoreName("GuildStore");

export default () => {
    const patches = [];

    // Get ALL possible components that might be member-related
    const componentSources = [
        // Direct props
        findByProps("GuildMemberRow"),
        findByProps("MemberListItem"),
        findByProps("MemberRow"),
        findByProps("UserRow"),
        
        // By name
        { MemberListItem: findByName("MemberListItem", false) },
        { VoiceUser: findByName("VoiceUser", false) },
        { ConnectedMember: findByName("ConnectedMember", false) },
        { Member: findByName("Member", false) },
        
        // By type name
        ...findByTypeNameAll("GuildMemberRow").map(c => ({ GuildMemberRow: c })),
        ...findByTypeNameAll("MemberListItem").map(c => ({ MemberListItem: c })),
        ...findByTypeNameAll("MemberRow").map(c => ({ MemberRow: c })),
        ...findByTypeNameAll("UserRow").map(c => ({ UserRow: c })),
        ...findByTypeNameAll("VoiceUser").map(c => ({ VoiceUser: c })),
    ].filter(Boolean);

    const patchComponent = (component, name, type = "type") => {
        if (!component) return;
        
        patches.push(after(type, component, ([props], ret) => {
            try {
                const { guildId, channel, user } = props || {};
                
                if (!ret || !user) return ret;
                
                const guild = GuildStore?.getGuild?.(guildId);
                const tag = getTag(guild, channel, user);

                if (tag && TagModule?.default) {
                    // Leave breadcrumb - add component name to tag text temporarily
                    const debugTag = {
                        ...tag,
                        text: tag.text + `[${name}]` // This will show which component worked
                    };
                    
                    const tagComponent = findInReactTree(ret, (c) => c?.type?.Types);
                    
                    if (!tagComponent || !BUILT_IN_TAGS.includes(getBotLabel?.(tagComponent.props?.type))) {
                        if (tagComponent) {
                            tagComponent.props = {
                                type: 0,
                                ...debugTag
                            };
                        } else {
                            // Try EVERY possible insertion strategy
                            const strategies = [
                                // Strategy 1: Direct children
                                () => ret?.props?.children && Array.isArray(ret.props.children) ? ret : null,
                                
                                // Strategy 2: flexDirection row
                                () => findInReactTree(ret, (c) => c?.props?.style?.flexDirection === "row"),
                                
                                // Strategy 3: any flex container
                                () => findInReactTree(ret, (c) => c?.props?.style?.display === "flex"),
                                
                                // Strategy 4: any children array
                                () => findInReactTree(ret, (c) => Array.isArray(c?.props?.children) && c.props.children.length > 0),
                                
                                // Strategy 5: look for View components
                                () => findInReactTree(ret, (c) => c?.type?.name === "View" && c.props?.children),
                                
                                // Strategy 6: any element with children
                                () => findInReactTree(ret, (c) => c?.props?.children)
                            ];

                            for (let i = 0; i < strategies.length; i++) {
                                const container = strategies[i]();
                                if (container?.props?.children) {
                                    if (Array.isArray(container.props.children)) {
                                        container.props.children.push(
                                            React.createElement(TagModule.default, {
                                                type: 0,
                                                text: debugTag.text,
                                                textColor: debugTag.textColor,
                                                backgroundColor: debugTag.backgroundColor,
                                                verified: debugTag.verified
                                            })
                                        );
                                        break;
                                    } else {
                                        // Convert single child to array
                                        container.props.children = [
                                            container.props.children,
                                            React.createElement(TagModule.default, {
                                                type: 0,
                                                text: debugTag.text,
                                                textColor: debugTag.textColor,
                                                backgroundColor: debugTag.backgroundColor,
                                                verified: debugTag.verified
                                            })
                                        ];
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                // Silent
            }
            
            return ret;
        }));
    };

    // Patch all found components
    componentSources.forEach(source => {
        if (typeof source === 'object') {
            Object.entries(source).forEach(([key, component]) => {
                if (component) {
                    patchComponent(component, key, "type");
                    // Also try "default" in case it's a different export
                    patchComponent(component, key + "_default", "default");
                }
            });
        }
    });

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
