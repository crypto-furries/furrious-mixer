import React, { useState, useEffect, forwardRef, useContext } from "react";
import furry from "../assets/logo.png";
import { Route, Switch, Link, useLocation } from "react-router-dom";
import Web3 from "web3";
import { connectHub } from "./mixer";
import AppBar from "@material-ui/core/AppBar";
import {
    Container,
    Typography,
    Grid,
    Backdrop,
    Tab,
    Tabs,
} from "@material-ui/core";
import { Deposit, Withdraw, Admin, Relay, AppContext } from "./components";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: "#fff",
    },
}));

function MyTab({ label, value }) {
    const renderLink = React.useMemo(
        () =>
            // eslint-disable-next-line react/display-name
            forwardRef((itemProps, ref) => (
                <Link to={value} ref={ref} {...itemProps} />
            )),
        [value]
    );

    return <Tab value={value} label={label} component={renderLink}></Tab>;
}

const MixerWindow = (props) => {
    const { state } = useContext(AppContext);
    const { hub } = props;
    const isAdmin = state?.account.toUpperCase() === hub?.owner.toUpperCase();

    return (
        <Container maxWidth="lg">
            <Grid
                container
                direction="column"
                justify="center"
                alignItems="center"
            >
                <Grid item style={{ width: "100%" }}>
                    <div
                        style={{
                            position: "relative",
                            height: "140px",
                        }}
                    >
                        <img
                            src={furry}
                            alt="Furry"
                            style={{
                                position: "absolute",
                                height: "140px",
                                left: "0",
                                zIndex: "-1",
                                transform: "scaleX(-1)",
                                top: "0",
                            }}
                        />
                        <Typography
                            variant="h1"
                            component="h1"
                            align="center"
                            style={{ paddingTop: "20px" }}
                        >
                            Furrious Mixer
                        </Typography>{" "}
                        <img
                            src={furry}
                            alt="Furry"
                            style={{
                                position: "absolute",
                                height: "140px",
                                right: "0",
                                zIndex: "-1",
                                top: "0",
                            }}
                        />
                    </div>
                </Grid>
                <Grid item style={{ width: "100%" }}>
                    <AppBar position="static">
                        <Tabs
                            value={useLocation().pathname}
                            aria-label="simple tabs example"
                            centered
                        >
                            <MyTab label="Deposit" value="/deposit" />
                            <MyTab label="Withdraw" value="/withdraw" />
                            <MyTab label="Relay" value="/relay" />
                            {isAdmin ? (
                                <MyTab label="Admin" value="/admin" />
                            ) : null}
                        </Tabs>
                    </AppBar>
                </Grid>
                <Grid item style={{ marginTop: "40px", width: "60%" }}>
                    <Switch>
                        <Route
                            path="/"
                            render={() => <Deposit {...props} />}
                            exact
                        />
                        <Route
                            path="/deposit"
                            render={() => <Deposit {...props} />}
                        />
                        <Route
                            path="/withdraw"
                            render={() => <Withdraw {...props} />}
                        />
                        <Route
                            path="/relay"
                            render={() => <Relay {...props} />}
                        />
                        {isAdmin ? (
                            <Route
                                path="/admin"
                                render={() => <Admin {...props} />}
                            />
                        ) : null}
                    </Switch>
                </Grid>
            </Grid>
        </Container>
    );
};

export const App = () => {
    const classes = useStyles();

    const [hub, setHub] = useState();
    const [web3, setWeb3] = useState();
    const [state, setState] = useState({ account: "", denominations: [] });
    const [open, setOpen] = useState(false);

    const ethereum = window.ethereum;

    const toggleBackdrop = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    useEffect(async () => {
        const load = async () => {
            if (!ethereum?.isConnected()) {
                alert("Connect to MetaMask!");
                return;
            }
            const web = new Web3(window.ethereum);
            try {
                await ethereum.request({ method: "eth_requestAccounts" });
            } catch (error) {
                console.error(error);
                alert("Ethereum doesn't work for you :(");
            }
            const hub = await connectHub(web);

            const fetchedDenominations = (await hub.denominations()).sort(
                (a, b) => parseFloat(a) - parseFloat(b)
            );
            const accounts = await ethereum.request({ method: "eth_accounts" });

            setHub(hub);
            setWeb3(web);
            setState({
                account: accounts[0],
                denominations: fetchedDenominations,
            });
        };

        load();
    }, []);

    const updateState = async () => {
        const fetchedDenominations = (await hub.denominations()).sort(
            (a, b) => parseFloat(a) - parseFloat(b)
        );
        setState({
            ...state,
            denominations: fetchedDenominations,
        });
    };

    ethereum.on("accountsChanged", (accounts) =>
        setState({ ...state, account: accounts[0] })
    );

    return (
        <>
            <Backdrop className={classes.backdrop} open={open}></Backdrop>
            <AppContext.Provider value={{ state, updateState }}>
                <MixerWindow
                    ethereum={ethereum}
                    hub={hub}
                    web3={web3}
                    toggleBackdrop={toggleBackdrop}
                />
            </AppContext.Provider>
        </>
    );
};
