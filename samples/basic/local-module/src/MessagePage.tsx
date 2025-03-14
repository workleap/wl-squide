import { useApplicationEventBusDispatcher, useToast } from "@basic/shared";
import { useCallback, useState, type ChangeEvent } from "react";
import { Link } from "react-router";

export function MessagePage() {
    const [message, setMessage] = useState("");

    const handleTextChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(event.target.value);
    }, []);

    const dispatch = useApplicationEventBusDispatcher();
    const showToast = useToast();

    const handleSendMessage = useCallback(() => {
        dispatch("write-to-host", message);
        showToast(message);
        setMessage("");
    }, [dispatch, showToast, setMessage, message]);

    return (
        <>
            <h1>Messaging</h1>
            <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>This page is served by <code>@basic/local-module</code></p>
            <div style={{ backgroundColor: "#d3d3d3", color: "black", width: "fit-content" }}>
                <p>There are a few distinctive features that are showcased with this pages:</p>
                <ul>
                    <li>The navigation item for this page has a priority of <code>999</code>, which renders it as the first item of the navbar.</li>
                    <li>The navigation item for this page use custom additional props to <code>highlight</code> the item in the navbar.</li>
                    <li>The "Send a message" feature showcase how Squide's event bus works.</li>
                </ul>
            </div>
            <h2>Send a message</h2>
            <p>Send the following to the host application:</p>
            <textarea value={message} onChange={handleTextChange} />
            <br />
            <button type="button" onClick={handleSendMessage}>Send</button>
            <p>Hint: have a look at your console log and at bottom right corner of your screen once the message has been sent :)</p>
            <Link to="/">Go back to home</Link>
        </>
    );
}

/** @alias */
export const Component = MessagePage;
