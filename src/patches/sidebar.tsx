import { findByTypeNameAll, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { General } from "@vendetta/ui/components";
import getTag from "../lib/getTag";
import { findByProps } from "@vendetta/metro";

const { View } = General;
const TagModule = findByProps("getBotLabel");
const GuildStore = findByStoreName("GuildStore");

export default () => {
    const patches = [];

    const rowPatch = ([{ user, guildId }], ret) => {
        try {
            if (!ret || !user || !guildId) return ret;
            
            const guild = GuildStore?.getGuild?.(guildId);
            const tag = getTag(guild, null, user);

            if (tag && TagModule?.default) {
                const existingTag = findInReactTree(ret?.props?.label, (c) => c.key == "StaffTagsView");
                if (!existingTag) {
                    ret.props.label = (
                        <View style={{
                            flex: 1,
                            flexDirection: "row", 
                            alignItems: "center",
                            justifyContent: "space-between" // This should separate content
                        }}
                        key="StaffTagsView">
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                flex: 0 // Don't take all space
                            }}>
                                {ret.props.label}
                                <TagModule.default
                                    type={0}
                                    text={tag.text}
                                    textColor={tag.textColor}
                                    backgroundColor={tag.backgroundColor}
                                    verified={tag.verified}
                                    style={{ marginLeft: 4 }}
                                />
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
