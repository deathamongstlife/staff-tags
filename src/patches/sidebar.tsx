import { findByTypeNameAll, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";
import { findByProps } from "@vendetta/metro";

const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;
const GuildStore = findByStoreName("GuildStore");

export default () => {
    const patches = [];

    // Use the exact same approach as your original code but with UserRow instead of GuildMemberRow
    const rowPatch = ([{ guildId, channel, user }], ret) => {
        try {
            if (!ret || !user || !guildId) return ret;

            const tagComponent = findInReactTree(ret, (c) => c?.type?.Types);
            if (!tagComponent || !BUILT_IN_TAGS.includes(getBotLabel?.(tagComponent.props?.type))) {
                const guild = GuildStore?.getGuild?.(guildId);
                const tag = getTag(guild, channel, user);

                if (tag && TagModule?.default) {
                    if (tagComponent) {
                        tagComponent.props = {
                            type: 0,
                            ...tag
                        };
                    } else {
                        // Use the exact same approach as your original - find the row and splice at position 2
                        const row = findInReactTree(ret, (c) => c?.props?.style?.flexDirection === "row");
                        if (row?.props?.children) {
                            row.props.children.splice(2, 0,
                                <TagModule.default
                                    type={0}
                                    text={tag.text}
                                    textColor={tag.textColor}
                                    backgroundColor={tag.backgroundColor}
                                    verified={tag.verified}
                                />
                            );
                        }
                    }
                }
            }
        } catch (error) {
            // Silent
        }
        
        return ret;
    };

    // Patch all UserRow components (this is what makes it work)
    findByTypeNameAll("UserRow").forEach((UserRow) => 
        patches.push(after("type", UserRow, rowPatch))
    );

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
