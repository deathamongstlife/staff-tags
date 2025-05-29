import { findByTypeNameAll, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { General } from "@vendetta/ui/components";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";
import { findByProps } from "@vendetta/metro";

const { View } = General;
const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;
const GuildStore = findByStoreName("GuildStore");

export default () => {
    const patches = [];

    // Patch member list using the same approach as the platform indicators plugin
    const rowPatch = ([{ user, guildId }], ret) => {
        try {
            if (!ret || !user || !guildId) return ret;
            
            const guild = GuildStore?.getGuild?.(guildId);
            const tag = getTag(guild, null, user);

            if (tag && TagModule?.default) {
                // Check if we already added a tag to avoid duplicates
                const existingTag = findInReactTree(ret?.props?.label, (c) => c.key == "StaffTagsView");
                if (!existingTag) {
                    // Use flex-start to keep everything aligned left, but add the tag inline
                    ret.props.label = (
                        <View style={{
                            justifyContent: "flex-start", // Keep left alignment
                            flexDirection: "row", 
                            alignItems: "center",
                            flexWrap: "wrap" // Allow wrapping if needed
                        }}
                        key="StaffTagsView">
                            {ret.props.label}
                            <TagModule.default
                                type={0}
                                text={tag.text}
                                textColor={tag.textColor}
                                backgroundColor={tag.backgroundColor}
                                verified={tag.verified}
                                style={{ 
                                    marginLeft: 6,
                                    marginRight: 4
                                }}
                            />
                        </View>
                    );
                }
            }
        } catch (error) {
            // Silent
        }
        
        return ret;
    };

    // Patch all UserRow components (same as platform indicators plugin)
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
