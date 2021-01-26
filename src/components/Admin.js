import React, { useEffect, useState, useContext } from "react";
import {
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    InputAdornment,
    Button,
    Grid,
    TextField,
    Typography,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import RedoIcon from "@material-ui/icons/Redo";
import { toWei, fromWei } from "web3-utils";
import { AppContext } from "./AppContext";

const DenominationListItem = ({ mixer, onDelete, onCreate }) => (
    <ListItem divider disableGutters style={{ paddingRight: "116px" }}>
        <ListItemText
            primary={`${fromWei(mixer.denomination, "ether")} ETH`}
            secondary={`${mixer.address}`}
        />
        <ListItemText
            primary={`${mixer.usedSlots}/${mixer.maxSlots}`}
            style={{ textAlign: "right" }}
        />
        <ListItemSecondaryAction>
            <IconButton
                edge="start"
                aria-label="redo"
                onClick={() => onCreate(mixer.denomination)}
            >
                <RedoIcon />
            </IconButton>
            <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => onDelete(mixer.denomination)}
            >
                <DeleteIcon />
            </IconButton>
        </ListItemSecondaryAction>
    </ListItem>
);

const inRange = (value) => value <= 1000 && value >= 0.01;

export const Admin = ({ hub, toggleBackdrop }) => {
    const [mixers, setMixers] = useState(null);
    const [inputValue, setInputValue] = useState(0.01);
    const { state, updateState } = useContext(AppContext);
    const { account, denominations } = state;

    const mapDenomination = async (denomination) => {
        const address = await hub.getMixerAddress(denomination);
        const mixer = await hub.getMixer(denomination);
        const stats = await mixer.stats();
        return { ...stats, denomination, address };
    };

    useEffect(async () => {
        const newMixers = await Promise.all(denominations.map(mapDenomination));
        newMixers.sort(
            (a, b) => parseFloat(a?.denomination) - parseFloat(b?.denomination)
        );
        setMixers(newMixers);
    }, [denominations]);

    const onDelete = async (denomination) => {
        toggleBackdrop();
        try {
            await hub.removeMixer(account, denomination);
            updateState();
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            toggleBackdrop();
        }
    };

    const onCreate = async (denomination) => {
        toggleBackdrop();
        try {
            await hub.createOrReplaceMixer(account, denomination);
            updateState();
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            toggleBackdrop();
        }
    };

    return mixers !== null ? (
        <>
            <Typography variant="h5">Deployed mixers:</Typography>
            <List>
                {mixers.map((mixer, index) => (
                    <DenominationListItem
                        key={`${index}`}
                        mixer={mixer}
                        onDelete={onDelete}
                        onCreate={onCreate}
                    />
                ))}
            </List>
            <Grid
                container
                direction="row"
                justify="space-around"
                alignItems="center"
                style={{ marginTop: "20px" }}
            >
                <TextField
                    variant="outlined"
                    type="number"
                    label="Denomination"
                    value={inputValue}
                    onChange={(event) =>
                        inRange(event.target.value) &&
                        setInputValue(event.target.value)
                    }
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">ETH</InputAdornment>
                        ),
                    }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() =>
                        mixers.some(
                            ({ denomination }) =>
                                denomination ===
                                toWei(inputValue.toString(), "ether")
                        )
                            ? alert("Mixer already exists")
                            : onCreate(toWei(inputValue.toString(), "ether"))
                    }
                >
                    Create
                </Button>
            </Grid>
        </>
    ) : null;
};
