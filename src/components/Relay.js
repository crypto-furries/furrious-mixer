import React, { useState, useContext } from "react";
import { Button } from "@material-ui/core";
import { TextField, Grid } from "@material-ui/core";
import { connectMixer } from "../mixer";
import { AppContext } from "./AppContext";

export const Relay = ({ web3, toggleBackdrop }) => {
    const [value, setValue] = useState("");
    const { state } = useContext(AppContext);
    const { account } = state;
    const onWithdraw = async () => {
        toggleBackdrop();
        try {
            const note = JSON.parse(value);
            const mixer = await connectMixer(web3, note.address);
            await mixer.withdraw(account, note);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
        toggleBackdrop();
    };

    return (
        <Grid
            container
            direction="column"
            justify="space-around"
            alignItems="center"
            spacing={5}
            style={{ width: "100%" }}
        >
            <Grid item style={{ width: "100%" }}>
                <TextField
                    multiline
                    variant="outlined"
                    label="Relayer note"
                    value={value}
                    style={{ maxWidth: "100%", width: "100%" }}
                    onChange={(event) => {
                        setValue(event.target.value);
                    }}
                />
            </Grid>
            <Grid item>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onWithdraw}
                >
                    Relay
                </Button>
            </Grid>
        </Grid>
    );
};
