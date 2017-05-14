/*
 * Emoji Tools
 * Copyright (C) 2015-2017 Mitch Talmadge (https://MitchTalmadge.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Injectable} from "@angular/core";
import * as fs from "fs-extra";
import {Logger} from "../../util/logger";
import {ETPNGChunkName} from "../../models/png/chunk-name.png.enum";
import {ETPNGChunk} from "../../models/png/chunk.png.model";
import {ETPNGChunks} from "../../models/png/chunks.png.model";

/**
 * Methods for working with PNG files.
 */
@Injectable()
export class PNGService {

    /**
     * A Buffer that contains the 8 byte header that should be present on all PNG files.
     */
    private static readonly PNG_HEADER_BUFFER = new Buffer([137, 80, 78, 71, 13, 10, 26, 10]);

    /**
     * Reads the Chunks from a PNG file.
     * @param pngFilePath The path to the PNG.
     * @returns A Promise that gives the Chunks.
     */
    public static readChunksFromPNG(pngFilePath: string): Promise<ETPNGChunks> {
        return new Promise<ETPNGChunks>((resolve, reject) => {
                // File descriptor
                let fd: number;

                try {
                    fd = fs.openSync(pngFilePath, 'r');
                    // The current position within the file.
                    let currentPosition = 0;

                    let chunks: ETPNGChunks = {};

                    // ---- HEADER ---- //
                    try {
                        let headerBuffer = new Buffer(8);
                        fs.readSync(fd, headerBuffer, 0, headerBuffer.length, currentPosition);
                        currentPosition += headerBuffer.length;

                        // Compare header to expected.
                        if (headerBuffer.compare(PNGService.PNG_HEADER_BUFFER) != 0) {
                            Logger.logError("The provided file is not a valid PNG file; header does not match.", this);
                            reject("Invalid PNG file.");
                            return;
                        }
                    } catch (errHeader) {
                        Logger.logError("Could not read PNG file header: " + errHeader, this);
                        reject("Could not read PNG file header.");
                        return;
                    }

                    // Read chunks
                    let currentChunk: ETPNGChunk;
                    do {
                        currentChunk = {};
                        try {
                            // ---- DATA LENGTH ---- //
                            let chunkLengthBuffer = new Buffer(4);
                            fs.readSync(fd, chunkLengthBuffer, 0, chunkLengthBuffer.length, currentPosition);
                            let dataLength = chunkLengthBuffer.readUInt32BE(0);
                            currentPosition += chunkLengthBuffer.length;

                            // ---- NAME ---- //
                            let chunkNameBuffer = new Buffer(4);
                            fs.readSync(fd, chunkNameBuffer, 0, chunkNameBuffer.length, currentPosition);
                            currentPosition += chunkNameBuffer.length;

                            // Assign the name.
                            let chunkName = chunkNameBuffer.toString("ASCII");
                            currentChunk.name = ETPNGChunkName[chunkName];

                            // Check if the name is known.
                            if (currentChunk.name == null) {
                                Logger.logError("Found a Chunk with an un-recognized name: " + chunkName, this);
                                reject("Un-recognized Chunk found.");
                                return;
                            }

                            // ---- DATA ---- //
                            let chunkDataBuffer = new Buffer(dataLength);
                            fs.readSync(fd, chunkDataBuffer, 0, chunkDataBuffer.length, currentPosition);
                            currentPosition += chunkDataBuffer.length;

                            // Assign the data
                            currentChunk.data = new Uint8Array(chunkDataBuffer);

                            // ---- CRC ---- //
                            // We can skip the CRC, it is not useful and will be calculated when writing.
                            currentPosition += 4;

                            // ---- FINISH ---- //

                            // Put the chunk into the map.
                            chunks[chunkName] = currentChunk;
                        } catch (errChunk) {
                            Logger.logError("Could not read a Chunk: " + errChunk, this);
                            reject("Could not read a Chunk.");
                            return;
                        }
                    } while (currentChunk.name != ETPNGChunkName.IEND); // Stop once we have read the end chunk.


                    resolve(chunks);
                } catch (err) {
                    Logger.logError("Could not open PNG file for reading: " + err, this);
                    reject("Could not open PNG file.");
                    return;
                } finally {
                    if (fd) {
                        fs.close(fd, err => {
                            if (err) {
                                Logger.logError("Could not close PNG file: " + err, this);
                            }
                        });
                    }
                }
            }
        );
    }

    /**
     * Writes Chunks to create a PNG File. CRCs will be re-calculated.
     * @param pngFilePath Where to write the PNG. Existing files will be overwritten.
     * @param chunks The chunks to write.
     */
    public static writeChunksToPNG(pngFilePath: string, chunks: ETPNGChunks): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // File descriptor
            let fd: number;

            try {
                // w+ means overwrite; the file contents will be cleared upon opening.
                fd = fs.openSync(pngFilePath, 'w+');

                // The current position within the file.
                let currentPosition = 0;

                // ---- HEADER ---- //
                fs.writeSync(fd, PNGService.PNG_HEADER_BUFFER, 0, PNGService.PNG_HEADER_BUFFER.length, 0);

                for(let chunk in chunks) {

                }
            } catch (err) {
                Logger.logError("Could not open PNG file for writing: " + err, this);
                reject("Could not open PNG file.");
                return;
            } finally {
                if (fd) {
                    fs.close(fd, err => {
                        if (err) {
                            Logger.logError("Could not close PNG file: " + err, this);
                        }
                    });
                }
            }
        });
    }

}