import { findByProps, findByStoreName, findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";

const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;
const GuildStore = findByStoreName("GuildStore");

// Try different possible profile components
const UserProfileModal = findByName("UserProfileModal", false);
const UserProfile = findByName("UserProfile", false);
const ProfileModal = findByName("ProfileModal", false);

export default () => {
    const patches = [];

    const patchProfile = (Component, name) => {
        if (!Component) return;
        
        patches.push(after("default", Component, ([props], ret) => {
            try {
                const { guildId, user } = props || {};
                
                if (!ret || !user) return ret;
                
                const guild = GuildStore?.getGuild?.(guildId);
                const tag = getTag(guild, undefined, user);

                if (tag && TagModule?.default) {
                    // Try to find where to insert the tag in the profile
                    const profileContent = findInReactTree(ret, (c) => 
                        c?.props?.children && Array.isArray(c.props.children)
                    );
                    
                    if (profileContent?.props?.children) {
                        profileContent.props.children.push(
                            React.createElement(TagModule.default, {
                                type: 0,
                                text: tag.text + `[${name}]`, // Debug marker
                                textColor: tag.textColor,
                                backgroundColor: tag.backgroundColor,
                                verified: tag.verified
                            })
                        );
                    }
                }
            } catch (error) {
                // Silent
            }
            
            return ret;
        }));
    };

    // Try patching different profile components
    patchProfile(UserProfileModal, "ProfileModal");
    patchProfile(UserProfile, "UserProfile");
    patchProfile(ProfileModal, "Modal");

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
