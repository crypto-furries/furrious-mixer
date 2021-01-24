import React, { useState, useContext, useEffect } from "react";
import { Button } from "@material-ui/core";
import { Grid, Slider, TextField, Typography } from "@material-ui/core";
import { fromWei } from "web3-utils";
import { AppContext } from "./AppContext";

const multipliers = [...Array(10)].map((_, index) => ({
    value: index + 1,
    label: `${index + 1}`,
}));

export const Deposit = ({ hub, toggleBackdrop }) => {
    const [value, setValue] = useState("");
    const [currentDenomination, setCurrentDenomination] = useState(0);
    const [multiplier, setMultiplier] = useState(1);
    const [statistics, setStatistics] = useState([]);
    const { state } = useContext(AppContext);
    const { account, denominations } = state;

    const mapDenomination = async (denomination) => {
        const mixer = await hub.getMixer(denomination);
        const stats = await mixer.stats();
        return { ...stats, denomination };
    };

    const updateStatistics = async () => {
        const newStatistics = await Promise.all(
            denominations.map(mapDenomination)
        );
        newStatistics.sort(
            (a, b) => parseFloat(a?.denomination) - parseFloat(b?.denomination)
        );
        setStatistics(newStatistics);
    };

    useEffect(updateStatistics, [denominations]);

    const onDeposit = async () => {
        toggleBackdrop();
        try {
            const mixer = await hub.getMixer(
                denominations[currentDenomination]
            );
            const privNote = await mixer.deposit(account, multiplier);
            setValue(JSON.stringify(privNote, null, 2));
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
        updateStatistics();
        toggleBackdrop();
    };

    const marks = denominations.map((den, index) => {
        return {
            value: index,
            label: `${fromWei(den, "ether")} ETH`,
        };
    });

    return denominations.length && statistics.length ? (
        <Grid
            container
            direction="column"
            justify="space-evenly"
            alignItems="center"
            spacing={5}
        >
            <Grid
                item
                style={{
                    width: "100%",
                }}
            >
                <Grid
                    container
                    direction="row"
                    justify="space-between"
                    alignItems="center"
                    spacing={1}
                >
                    <Grid item>
                        <Typography gutterBottom display="inline">
                            Denomination
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Typography gutterBottom display="inline">
                            {`${statistics[currentDenomination].usedSlots}/${statistics[currentDenomination].maxSlots} slots used, ` +
                                `anonymity set: ${statistics[currentDenomination].anonymitySet}`}
                        </Typography>
                    </Grid>
                </Grid>
                <Slider
                    min={0}
                    max={denominations.length - 1}
                    value={currentDenomination}
                    onChange={(_, newDenomination) =>
                        setCurrentDenomination(newDenomination)
                    }
                    aria-labelledby="denomination-slider"
                    step={null}
                    valueLabelDisplay="off"
                    marks={marks}
                />
            </Grid>
            <Grid
                item
                style={{
                    width: "100%",
                }}
            >
                <Typography gutterBottom>Multiplier</Typography>
                <Slider
                    min={1}
                    max={multipliers.length}
                    value={multiplier}
                    onChange={(_, newMultiplier) =>
                        setMultiplier(newMultiplier)
                    }
                    aria-labelledby="multiplier-slider"
                    step={null}
                    valueLabelDisplay="off"
                    marks={multipliers}
                />
            </Grid>
            <Grid item>
                <Button variant="contained" color="primary" onClick={onDeposit}>
                    Deposit
                </Button>
            </Grid>
            {value ? (
                <Grid
                    item
                    style={{
                        width: "100%",
                    }}
                >
                    <TextField
                        multiline
                        variant="outlined"
                        label="Note"
                        value={value}
                        style={{
                            maxWidth: "100%",
                            width: "100%",
                        }}
                        InputProps={{
                            readOnly: true,
                        }}
                    />
                </Grid>
            ) : null}
        </Grid>
    ) : null;
};
