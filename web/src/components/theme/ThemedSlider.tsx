import classNames from "classnames"
import Slider, { type SliderProps } from "rc-slider"

export type ThemedSliderProps = SliderProps

export default function ThemedSlider({ className, styles, ...rest }: ThemedSliderProps) {
    return (
        <Slider
            className={classNames("bg-transparent!", className)}
            styles={{
                track: {
                    backgroundColor: "var(--color-key)",
                },
                rail: {
                    backgroundColor: "var(--color-quaternary)",
                },
                handle: {
                    border: "1px solid var(--color-key)",
                    backgroundColor: "var(--color-key-subtle)",
                    opacity: 1,
                },
                ...styles,
            }}
            {...rest}
        />
    )
}
