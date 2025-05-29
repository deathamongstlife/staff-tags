import { findByProps, findByStoreName, findByTypeNameAll } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";

const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;
const GuildStore = findByStoreName("GuildStore");

const rowPatch = ([{ guildId, user }], ret) => {
    try {
        if (!ret?.props?.label || !getBotLabel) return ret;
        
        const tagComponent = findInReactTree(ret.props.label, (c) => c?.type?.Types);
        const existingTag = tagComponent ? getBotLabel(tagComponent.props?.type) : null;
        
        if (!tagComponent || !BUILT_IN_TAGS.includes(existingTag)) {
            const guild = GuildStore?.getGuild?.(guildId);
            const tag = getTag(guild, undefined, user);

            if (tag && TagModule?.default) {
                if (tagComponent) {
                    tagComponent.props = {
                        type: 0,
                        ...tag
                    };
                } else {
                    const row = findInReactTree(ret.props.label, (c) => c?.props?.lineClamp);
                    if (row?.props?.children?.props?.children) {
                        const children = row.props.children.props.children;
                        if (Array.isArray(children) && children.length > 1) {
                            children[1] = (<>
                                {" "}
                                <TagModule.default
                                    type={0}
                                    text={tag.text}
                                    textColor={tag.textColor}
                                    backgroundColor={tag.backgroundColor}
                                    verified={tag.verified}
                                />
                            </>);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Staff Tags - Details patch error:", error);
    }
    
    return ret;
};

export default () => {
    const patches = [];

    try {
        const UserRows = findByTypeNameAll("UserRow");
        if (UserRows?.length > 0) {
            UserRows.forEach((UserRow) => {
                if (UserRow?.type) {
                    patches.push(after("type", UserRow, rowPatch));
                }
            });
        }
    } catch (error) {
        console.error("Staff Tags - Failed to patch UserRow:", error);
    }

    return () => {
        patches.forEach((unpatch) => {
            try {
                unpatch?.();
            } catch (error) {
                console.error("Staff Tags - Unpatch error:", error);
            }
        });
    };
};
