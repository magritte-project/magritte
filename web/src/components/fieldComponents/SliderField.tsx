import type { ThemedSliderProps } from "@/components/theme/ThemedSlider"
import ThemedSlider from "@/components/theme/ThemedSlider"
import { useFieldContext } from "@/contexts/formContext"

export type SliderFieldProps = Omit<
    ThemedSliderProps,
    "value" | "defaultValue" | "onChange" | "onBlur"
>

export default function SliderField(props: SliderFieldProps) {
    const field = useFieldContext<number | number[]>()
    return (
        <ThemedSlider
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            {...props}
        />
    )
}
