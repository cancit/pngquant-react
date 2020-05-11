import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import { PngQuant } from "./pngquant";
import { useDropzone } from "react-dropzone";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Button from "@material-ui/core/Button";
import Avatar from "@material-ui/core/Avatar";
import { uuidv4 } from "./util";
import ImageIcon from "@material-ui/icons/Image";
import DownloadIcon from "@material-ui/icons/CloudDownload";
import OpenIcon from "@material-ui/icons/OpenInNew";

import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import { readableFileSize, dataURLtoUint8, waterfall } from "./util";
import CircularProgress from "@material-ui/core/CircularProgress";
import _ from "lodash";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface FileHolder {
  id: string;
  file: File;
  state: "waiting" | "progress" | "compressed";
  output?: {
    data: Uint8Array;
    size: number;
    blobPath: string;
    time: number;
  };
}
function App() {
  const [inputImageData, setInputImageData] = useState<Uint8Array | undefined>(
    undefined
  );
  const [files, setFiles] = useState<FileHolder[]>();
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Do something with the files
    console.log(acceptedFiles);
    const fileHolders = acceptedFiles.map(
      (f) =>
        ({
          id: uuidv4(),
          file: f,
          state: "waiting",
        } as FileHolder)
    ) as FileHolder[];
    download(fileHolders, files?.length || 0);
    setFiles((files) => (files ? files.concat(fileHolders) : fileHolders));
  }, []);

  const download = async (files: FileHolder[], index: number) => {
    if (!files || files.length <= index) {
      return;
    }
    const f = files[index];
    PngQuant.toByte(f.file).then((b) =>
      PngQuant.compress(b).then((res) => {
        const ff = _.cloneDeep(f);
        ff.state = "compressed";
        ff.output = {
          data: res.data,
          size: res.data.buffer.byteLength,
          blobPath: URL.createObjectURL(
            new Blob([res.data], { type: "image/png" })
          ),
          time: res.time,
        };
        console.log("compressed");
        setFiles((files: FileHolder[] | undefined) => {
          const newFiles = _.cloneDeep(files);
          newFiles![newFiles!.findIndex((a) => a.id === ff.id)] = ff;
          return newFiles;
        });
        download(files, index + 1);
      })
    );
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    PngQuant.prepare(() => {
      console.log("prepared");
    });
  }, []);
  const onChange = (e: any) => {
    var files = e.target.files;
    console.log(files);
    var dataUrlReader = new FileReader();
    dataUrlReader.onload = function (e: any) {
      console.log(e.target.result);
      setInputImageData(dataURLtoUint8(e.target.result));
      PngQuant.compress(dataURLtoUint8(e.target.result)).then((img) => {
        var blob = new Blob([img.data], { type: "image/png" });
        var url = URL.createObjectURL(blob);
        // setCompressedImage(url as any);
      });
    };
    dataUrlReader.readAsDataURL(files[0]);
  };
  const onDownloadAll = () => {
    /* PngQuant.compress(inputImageData!).then((img) => {
      var blob = new Blob([img], { type: "image/png" });
      var url = URL.createObjectURL(blob);
      //  setCompressedImage(url as any);
    }); */
    const zip = new JSZip();
    files?.forEach((a) => {
      zip.file(a.file.name, a.output!.data!);
    });
    zip.generateAsync({ type: "blob" }).then(function (content) {
      // see FileSaver.js
      saveAs(content, "tinified.zip");
    });
  };
  const onDownload = (f: FileHolder) => () => {
    saveAs(f.output!.blobPath, f.file.name);
  };
  return (
    <div className="App">
      <div
        style={{
          borderStyle: "dashed",
          borderWidth: 1,
          borderColor: "white",
          padding: 24,
          minHeight: 80,
          borderRadius: 24,
          display: "flex",
          marginTop: 64,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 700,
        }}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <Typography>Drop the files here ...</Typography>
        ) : (
          <Typography>
            {"Drag & drop some files here, or click to select files"}
          </Typography>
        )}
      </div>
      {
        <List style={{ width: "100%", maxWidth: 800 }}>
          {files &&
            files.map((f, i) => (
              <ListItem key={i} style={{}}>
                <ListItemAvatar>
                  <Avatar>
                    <ImageIcon htmlColor="white" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={f.file.name}
                  secondary={
                    <div style={{ display: "flex", flexDirection: "row" }}>
                      {<Typography>{readableFileSize(f.file.size)}</Typography>}
                      {f.state === "compressed" && (
                        <>
                          <Typography>{" / "}</Typography>
                          <Typography color="primary" style={{ marginLeft: 4 }}>
                            {readableFileSize(f.output?.size || 0)}
                          </Typography>
                          <Typography
                            color="primary"
                            style={{ marginLeft: 12 }}
                          >
                            {"-" +
                              (
                                ((f.file.size - (f.output?.size || 0)) /
                                  f.file.size) *
                                100
                              ).toFixed() +
                              "%"}
                          </Typography>
                        </>
                      )}
                    </div>
                  }
                />
                <ListItemSecondaryAction>
                  {(f.state === "waiting" || f.state === "progress") && (
                    <CircularProgress />
                  )}
                  {f.state === "compressed" && (
                    <>
                      <IconButton
                        onClick={() => {
                          window.open(f.output?.blobPath, "_blank");
                        }}
                      >
                        <OpenIcon />
                      </IconButton>
                      <IconButton onClick={onDownload(f)}>
                        <DownloadIcon />
                      </IconButton>
                    </>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
        </List>
      }
      {files &&
        files.filter((a) => a.state === "compressed").length ===
          files.length && (
          <Button variant="outlined" onClick={onDownloadAll}>
            Download All
          </Button>
        )}
    </div>
  );
}

export default App;
