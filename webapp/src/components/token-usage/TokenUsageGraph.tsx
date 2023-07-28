import {
    Body1,
    Button,
    Divider,
    makeStyles,
    mergeClasses,
    Popover,
    PopoverSurface,
    PopoverTrigger,
    shorthands,
    Text,
    tokens,
} from '@fluentui/react-components';
import { Brands } from '@fluentui/tokens';
import {
    TokenUsage,
    TokenUsageFunctionNameMap,
    TokenUsageView,
    TokenUsageViewDetails,
} from '../../libs/models/TokenUsage';
import { useAppSelector } from '../../redux/app/hooks';
import { RootState } from '../../redux/app/store';
import { semanticKernelBrandRamp } from '../../styles';
import { TypingIndicator } from '../chat/typing-indicator/TypingIndicator';
import { Info16 } from '../shared/BundledIcons';
import { TokenUsageBar } from './TokenUsageBar';
import { TokenUsageLegendItem } from './TokenUsageLegendItem';

const useClasses = makeStyles({
    horizontal: {
        display: 'flex',
        ...shorthands.gap(tokens.spacingVerticalSNudge),
        alignItems: 'center',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap(tokens.spacingHorizontalS),
        paddingBottom: tokens.spacingHorizontalM,
    },
    popover: {
        width: '300px',
    },
    header: {
        marginBlockEnd: tokens.spacingHorizontalM,
    },
    legend: {
        'flex-flow': 'wrap',
    },
});

interface ITokenUsageGraph {
    tokenUsage: TokenUsage;
    promptView?: boolean;
}

const contrastColors = [
    tokens.colorPaletteBlueBackground2,
    tokens.colorPaletteBlueForeground2,
    tokens.colorPaletteBlueBorderActive,
];

export const TokenUsageGraph: React.FC<ITokenUsageGraph> = ({ promptView, tokenUsage }) => {
    const classes = useClasses();
    const { conversations, selectedId } = useAppSelector((state: RootState) => state.conversations);
    const loadingResponse = conversations[selectedId].botResponseStatus;

    const responseGenerationView: TokenUsageView = {};
    const memoryExtractionView: TokenUsageView = {};

    let memoryExtractionUsage = 0;
    let responseGenerationUsage = 0;
    let brandColorIndex = 120 as Brands;
    const brandStep = 20;
    let contrastColorsIndex = 0;

    Object.entries(tokenUsage).forEach(([key, value]) => {
        const viewDetails: TokenUsageViewDetails = {
            usageCount: value ?? 0,
            legendLabel: TokenUsageFunctionNameMap[key],
            color: semanticKernelBrandRamp[brandColorIndex],
        };

        if (key.toLocaleUpperCase().includes('MEMORY')) {
            memoryExtractionUsage += value ?? 0;
            viewDetails.color = contrastColors[contrastColorsIndex++];
            memoryExtractionView[key] = viewDetails;
        } else {
            responseGenerationUsage += value ?? 0;
            brandColorIndex = (brandColorIndex - brandStep < 0 ? 160 : brandColorIndex - brandStep) as Brands;
            responseGenerationView[key] = viewDetails;
        }
    });

    const totalUsage = memoryExtractionUsage + responseGenerationUsage;

    return (
        <>
            <h3 className={classes.header}>
                Token Usage
                <Popover withArrow>
                    <PopoverTrigger disableButtonEnhancement>
                        <Button icon={<Info16 />} appearance="transparent" />
                    </PopoverTrigger>
                    <PopoverSurface className={classes.popover}>
                        <Body1>
                            Token count for each category is the total sum of tokens used for the prompt template and
                            chat completion for the respective completion functions. For more details about token usage,
                            see:{' '}
                            <a href="https://learn.microsoft.com/en-us/dotnet/api/azure.ai.openai.completionsusage?view=azure-dotnet-preview">
                                CompletionsUsage docs here.
                            </a>
                        </Body1>
                    </PopoverSurface>
                </Popover>
            </h3>
            <div className={classes.content}>
                {loadingResponse ? (
                    <Body1>
                        Final token usage will be available once bot response is generated.
                        <TypingIndicator />
                    </Body1>
                ) : (
                    <>
                        {totalUsage > 0 ? (
                            <>
                                {!promptView && <Text>Total token usage for current session</Text>}
                                <div className={classes.horizontal} style={{ gap: tokens.spacingHorizontalXXS }}>
                                    {Object.entries(responseGenerationView).map(([key, details]) => {
                                        return <TokenUsageBar key={key} details={details} totalUsage={totalUsage} />;
                                    })}
                                    {Object.entries(memoryExtractionView).map(([key, details]) => {
                                        return <TokenUsageBar key={key} details={details} totalUsage={totalUsage} />;
                                    })}
                                </div>
                                <div className={mergeClasses(classes.legend, classes.horizontal)}>
                                    <TokenUsageLegendItem
                                        key={'Response Generation'}
                                        name={'Response Generation'}
                                        usageCount={responseGenerationUsage}
                                        items={responseGenerationView}
                                        color={semanticKernelBrandRamp[(brandColorIndex + brandStep) as Brands]}
                                    />
                                    <TokenUsageLegendItem
                                        key={'Memory Extraction'}
                                        name={'Memory Extraction'}
                                        usageCount={memoryExtractionUsage}
                                        items={memoryExtractionView}
                                        color={contrastColors[contrastColorsIndex - 1]}
                                    />
                                </div>
                            </>
                        ) : promptView ? (
                            <Text>No tokens were used. This is a hardcoded response.</Text>
                        ) : (
                            <Text>No tokens have been used in this session yet.</Text>
                        )}
                    </>
                )}
            </div>
            <Divider />
        </>
    );
};