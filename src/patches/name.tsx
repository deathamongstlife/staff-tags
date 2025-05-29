import { findByName, findByProps, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";

const DisplayName = findByName("DisplayName", false);
const HeaderName = findByName("HeaderName", false);

const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;

const GuildStore = findByStoreName("GuildStore");
const ChannelStore = findByStoreName("ChannelStore");

export default () => {
    const patches = [];

    if (HeaderName) {
        patches.push(after("default", HeaderName, ([{ channelId }], ret) => {
            try {
                if (ret?.props) {
                    ret.props.channelId = channelId;
                }
            } catch (error) {
                console.error("Staff Tags - HeaderName patch error:", error);
            }
        }));
    }

    if (DisplayName) {
        patches.push(after("default", DisplayName, ([{ guildId, channelId, user }], ret) => {
            try {
                if (!ret || !getBotLabel) return;
                
                const tagComponent = findInReactTree(ret, (c) => c?.type?.Types);
                if (!tagComponent || !BUILT_IN_TAGS.includes(getBotLabel(tagComponent.props?.type))) {
                    const guild = GuildStore?.getGuild?.(guildId);
                    const channel = ChannelStore?.getChannel?.(channelId);
                    const tag = getTag(guild, channel, user);

                    if (tag && TagModule?.default) {
                        if (tagComponent) {
                            tagComponent.props = {
                                type: 0,
                                ...tag
                            };
                        } else {
                            const row = findInReactTree(ret, (c) => c?.props?.style?.flexDirection === "row");
                            if (row?.props?.children && Array.isArray(row.props.children)) {
                                row.props.children.push(
                                    React.createElement(TagModule.default, {
                                        style: { marginLeft: 0 },
                                        type: 0,
                                        text: tag.text,
                                        textColor: tag.textColor,
                                        backgroundColor: tag.backgroundColor,
                                        verified: tag.verified
                                    })
                                );
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Staff Tags - DisplayName patch error:", error);
            }
        }));
    }

    return () => patches.forEach((unpatch) => {
        try {
            unpatch?.();
        } catch (error) {
            console.error("Staff Tags - Name unpatch error:", error);
        }
    });
};
