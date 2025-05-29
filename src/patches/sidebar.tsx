import { findByTypeNameAll, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import getTag from "../lib/getTag";
import { findByProps } from "@vendetta/metro";

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
                // Try to find the actual row structure like your original code did
                const row = findInReactTree(ret, (c) => c?.props?.style?.flexDirection === "row");
                
                if (row?.props?.children && Array.isArray(row.props.children)) {
                    // Check if we already added the tag
                    const existingTag = row.props.children.find(child => child?.key === "StaffTagsInsert");
                    
                    if (!existingTag) {
                        // Insert at position 2 (after avatar and name, before status indicators)
                        row.props.children.splice(2, 0,
                            <TagModule.default
                                key="StaffTagsInsert"
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
