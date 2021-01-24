import React, { useState, useContext, useEffect, useMemo } from "react";
import { Button, Typography } from "@material-ui/core";
import { Grid, Switch, TextField, InputAdornment } from "@material-ui/core";
import { connectMixer } from "../mixer";
import { toWei, fromWei } from "web3-utils";
import { AppContext } from "./AppContext";

const RelayerProofGenerator = ({ note, web3 }) => {
    const [newNote, setNewNote] = useState("");
    const [relayer, setRelayer] = useState("");
    const [destination, setDestination] = useState("");
    const [relayerFee, setRelayerFee] = useState(0);

    const maxRange = parseFloat(fromWei(note?.denomination ?? "0", "ether"));
    const inRange = (value) => value <= maxRange && value >= 0;

    const generateRelayerNote = async () => {
        try {
            const mixer = await connectMixer(web3, note.address);
            const request = await mixer.generateWithdrawalRequest(
                note,
                destination,
                relayer,
                toWei(relayerFee.toString(), "ether")
            );
            setNewNote(JSON.stringify(request, null, 2));
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    return (
        <Grid
            container
            direction="column"
            justify="space-around"
            alignItems="center"
            spacing={3}
            style={{ width: "100%", margin: "0" }}
        >
            <Grid item style={{ width: "100%" }}>
                <Grid
                    container
                    direction="row"
                    justify="space-around"
                    alignItems="flex-start"
                >
                    <Grid item>
                        <TextField
                            id="relayer"
                            label="Relayer"
                            variant="outlined"
                            value={relayer}
                            onChange={(event) => setRelayer(event.target.value)}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            id="destination"
                            label="Destination"
                            variant="outlined"
                            value={destination}
                            onChange={(event) =>
                                setDestination(event.target.value)
                            }
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            id="relayer-fee"
                            variant="outlined"
                            type="number"
                            label="Relayer fee"
                            value={relayerFee}
                            onChange={(event) =>
                                inRange(event.target.value) &&
                                setRelayerFee(event.target.value)
                            }
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        ETH
                                    </InputAdornment>
                                ),
                            }}
                            style={{ width: "200px" }}
                        />
                    </Grid>
                </Grid>
            </Grid>
            <Grid item>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={generateRelayerNote}
                >
                    Generate
                </Button>
            </Grid>
            {newNote ? (
                <Grid item style={{ width: "100%" }}>
                    <TextField
                        multiline
                        variant="outlined"
                        label="Relayer note"
                        value={newNote}
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
    );
};

export const Withdraw = ({ web3, toggleBackdrop }) => {
    const [value, setValue] = useState("");
    const [statistics, setStatistics] = useState(null);
    const [relayer, setRelayer] = useState(false);
    const { state } = useContext(AppContext);
    const { account } = state;

    const onWithdraw = async () => {
        toggleBackdrop();
        try {
            const note = JSON.parse(value);
            const mixer = await connectMixer(web3, note.address);
            const request = await mixer.generateWithdrawalRequest(
                note,
                account,
                account,
                0
            );
            await mixer.withdraw(account, request);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
        updateStats();
        toggleBackdrop();
    };

    let json = useMemo(() => {}, [value]);
    try {
        json = useMemo(() => JSON.parse(value), [value]);
    } catch (error) {
        // Ignore error here, we parse it again in onWithdraw
    }

    const updateStats = async () => {
        if (json) {
            try {
                const mixer = await connectMixer(web3, json.address);
                const unspentUnits = await mixer.getUnspentUnits(json);
                setStatistics({
                    ...(await mixer.stats()),
                    unspentUnits: unspentUnits.length,
                    denomination: fromWei(mixer.denomination, "ether"),
                });
            } catch {
                setStatistics(null);
            }
        } else {
            setStatistics(null);
        }
    };
    useEffect(updateStats, [json]);

    return (
        <Grid
            container
            direction="column"
            justify="space-around"
            alignItems="center"
            spacing={3}
        >
            <Grid item style={{ width: "100%" }}>
                <Grid
                    container
                    direction="row"
                    justify="space-between"
                    alignItems="center"
                    spacing={1}
                >
                    <Grid item>
                        <Grid
                            container
                            direction="row"
                            justify="flex-start"
                            alignItems="center"
                            spacing={1}
                        >
                            <Grid item>
                                <Typography>Generate relayer note</Typography>
                            </Grid>
                            <Grid item>
                                <Switch
                                    checked={relayer}
                                    onChange={(event) =>
                                        setRelayer(event.target.checked)
                                    }
                                    color="primary"
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item>
                        {statistics ? (
                            <Typography id="anonymity-set" display="inline">
                                {(statistics.unspentUnits
                                    ? `${statistics.unspentUnits} x ${statistics.denomination}`
                                    : "No") +
                                    ` ETH left, anonymity set: ${statistics.anonymitySet}`}
                            </Typography>
                        ) : null}
                    </Grid>
                </Grid>
            </Grid>
            <Grid item style={{ width: "100%" }}>
                <TextField
                    multiline
                    variant="outlined"
                    label="Note"
                    value={value}
                    style={{
                        maxWidth: "100%",
                        width: "100%",
                    }}
                    onChange={(event) => {
                        setValue(event.target.value);
                    }}
                />
            </Grid>
            {relayer ? (
                <Grid item style={{ width: "100%" }}>
                    <RelayerProofGenerator note={json} web3={web3} />
                </Grid>
            ) : null}
            {!relayer ? (
                <Grid item>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onWithdraw}
                    >
                        Withdraw
                    </Button>
                </Grid>
            ) : null}
        </Grid>
    );
};
