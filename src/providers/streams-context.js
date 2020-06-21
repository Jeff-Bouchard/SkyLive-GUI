import React, { useState, useEffect } from 'react';
import { channels } from './../shared/constants.js';
const { ipcRenderer } = window;

const StreamsContext = React.createContext();



function fetchStreamData(token) {
    return new Promise((resolve, reject) => {
        //console.log(token);
        ipcRenderer.send(channels.STREAM_DATA, { token });
        ipcRenderer.on(channels.STREAM_DATA, (event, { err, res }) => {
            if (err) {
                reject(err);
                return;
            }
            if (res.token == token) {
                ipcRenderer.removeAllListeners(channels.STREAM_DATA);
            }
            resolve(res);
        });

    });
}

const StreamsProvider = props => {


    const [allStreams, setAllStreams] = useState({});

    const addStream = (token, stream) => {
        let newStream = {}
        newStream[token] = stream;
        setAllStreams({ ...allStreams, ...newStream });
    }

    const removeStream = (token) => {
        let newAllStreams = { ...allStreams };
        delete newAllStreams[token];
        setAllStreams(newAllStreams);
    }

    const createStreamBasic = (token, command) => {

        return new Promise((res, rej) => {
            if (allStreams[token]) rej(new Error("Stream with same token already exists"));
            else res();
        })
            .then(() => fetchStreamData(token))
            .catch(err => {
                console.error(err);
                throw err;
            })
    }

    const createHlsStream = (token, dir) => {
        return createStreamBasic(token, "blahblah").then(res => {
            ipcRenderer.send(channels.CREATE_HLS_STREAM, { token, dir });
            addStream(token, res.data);
            //console.log(allStreams);
            //console.log("this does run");
            return res;
        });
    }

    const createRtmpStream = (token) => {
        return createStreamBasic(token, "blahblah").then(res => {
            ipcRenderer.send(channels.CREATE_RTMP_STREAM, { token });
            addStream(token, res.data);
            //console.log(allStreams);
            //console.log("this does run");
            return res;
        })

    }

    const createRestream = (token, url) => {
        return createStreamBasic(token, "blahblah").then(res => {
            ipcRenderer.send(channels.CREATE_RESTREAM, { token, url });
            addStream(token, res.data);
            //console.log(allStreams);
            //console.log("this does run");
            return res;
        })

    }


    const closeStream = (token) => {
        //console.log(token)
        ipcRenderer.send(channels.CLOSE_STREAM, { token });
        removeStream(token);
    }

    useEffect(() => {
        const vegeta = (event, { token, output }) => {
            //console.log("token:" + token);
            //console.log(allStreams);
            if (!allStreams[token]) {
                //console.log("shame");
                return;
            }
            let newOutput = allStreams[token].output ? [...allStreams[token].output, output] : [output];
            let newAllStreams = { ...allStreams };
            newAllStreams[token].output = newOutput;
            setAllStreams(newAllStreams);
        }
        ipcRenderer.on(channels.STREAM_STD_OUT, vegeta);
        return () => ipcRenderer.removeListener(channels.STREAM_STD_OUT, vegeta);
    }, [allStreams])



    return <StreamsContext.Provider value={{ allStreams, createHlsStream, createRtmpStream, createRestream, closeStream }} {...props} />
}



const useStreams = () => React.useContext(StreamsContext);
export { useStreams, StreamsProvider }