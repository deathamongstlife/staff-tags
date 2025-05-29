import { findByProps } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";

const Tag = findByProps("getBotLabel");

export default () => after("default", Tag, ([{ text, textColor, backgroundColor }], ret) => {
    try {
        const label = findInReactTree(ret, (c) => typeof c?.props?.children === "string");

        if (label?.props) {
            if (text) {
                label.props.children = text;
            }
            if (textColor) {
                if (!label.props.style) label.props.style = [];
                if (Array.isArray(label.props.style)) {
                    label.props.style.push({ color: textColor });
                } else {
                    label.props.style = [label.props.style, { color: textColor }];
                }
            }
        }
        
        if (backgroundColor && ret?.props) {
            if (!ret.props.style) ret.props.style = [];
            if (Array.isArray(ret.props.style)) {
                ret.props.style.push({ backgroundColor });
            } else {
                ret.props.style = [ret.props.style, { backgroundColor }];
            }
        }
    } catch (error) {
        console.error("Staff Tags - Tag patch error:", error);
    }
});
