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
                    // Use space-between to push tag between name and status icons
                    ret.props.label = (
                        <View style={{
                            justifyContent: "space-between", // This pushes items apart
                            flexDirection: "row", 
                            alignItems: "center",
                            flex: 1 // Take full width
                        }}
                        key="StaffTagsView">
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                flex: 1 // Take available space
                            }}>
                                {ret.props.label}
                                <View key="StaffTagsMemberList" style={{
                                    flexDirection: 'row',
                                    marginLeft: 4
                                }}>
                                    <TagModule.default
                                        type={0}
                                        text={tag.text}
                                        textColor={tag.textColor}
                                        backgroundColor={tag.backgroundColor}
                                        verified={tag.verified}
                                    />
                                </View>
                            </View>
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
