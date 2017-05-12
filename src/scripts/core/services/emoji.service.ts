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
import {FontToolsService} from "./font-tools.service";
import {ETProject} from "../../models/project.model";
import {Observable} from "rxjs/Observable";
import * as path from "path";
import {ETFontType} from "../../models/font-type.enum";
import {ETConstants} from "../../util/constants";
import * as fs from "fs-extra";
import {cmapTableService} from "./tables/cmap.table.service";
import {CBDTTableService} from "./tables/cbdt.table.service";
import {Logger} from "../../util/logger";
import {GSUBTableService} from "./tables/gsub.table.service";
import {ETcmapSubtable} from "../../models/tables/cmap/subtable.cmap.model";
import {ProjectService} from "./project.service";
import {ETEmoji} from "../../models/emoji.model";
import {DomSanitizer} from "@angular/platform-browser";
import {sbixTableService} from "./tables/sbix.table.service";
import {CgBIService} from "./cgbi.service";

@Injectable()
export class EmojiService {

    constructor(private projectService: ProjectService,
                private domSanitizer: DomSanitizer,
                private fontToolsService: FontToolsService,
                private cmapTableService: cmapTableService,
                private CBDTTableService: CBDTTableService,
                private GSUBTableService: GSUBTableService,
                private sbixTableService: sbixTableService,
                private CgBIService: CgBIService) {
    }

    /**
     * Gets an array of extracted Emojis.
     * Will throw an error if Emojis have not been extracted.
     * @param project The project.
     * @returns A Promise that gives the array of Emojis.
     */
    public getExtractedEmojis(project: ETProject): Promise<ETEmoji[]> {
        return new Promise((resolve, reject) => {
            if (project.extractionPath == null || !fs.existsSync(project.extractionPath)) {
                reject("Cannot get extracted Emojis; Emojis have not yet been extracted.");
                return;
            }

            // Get an array of the files from the extraction path.
            let emojiFiles = fs.readdirSync(project.extractionPath);
            let emojis: ETEmoji[] = [];

            // For each file
            emojiFiles.forEach(fileName => {
                if (!fileName.endsWith(".png")) {
                    Logger.logError("Found a non-Emoji file in the extraction dir: " + fileName, this);
                    reject("Cannot get extracted Emojis; there was a non-Emoji file in the extraction directory: " + fileName);
                }

                // Make an Emoji
                let emoji: ETEmoji = {};

                // Assign the Emoji path
                emoji.imagePath = path.join(project.extractionPath, fileName);

                // Assign the SafeUrl Emoji path for Angular.
                emoji.imgSrcPath = this.domSanitizer.bypassSecurityTrustUrl(emoji.imagePath);

                // Remove the extension and split the name to get the codes
                emoji.codes = fileName.replace('.png', '').split("_");

                // Add the Emoji to the array.
                emojis.push(emoji);
            });

            resolve(emojis);
        });
    }

    /**
     * Extracts the emojis from the project's font file.
     * @param project The project.
     * @returns An Observable that returns, periodically, the percentage completion (0 to 100), or an error if something goes wrong.
     */
    public extractEmojis(project: ETProject): Observable<number> {
        return Observable.create(listener => {
            if (!fs.existsSync(project.fontPath)) {
                listener.error("The font file could not be found.");
                return;
            }

            // 0% Complete
            listener.next(0);

            // Path for the new ttx files.
            let ttxDirPath = path.join(project.dataPath, ETConstants.PROJECT_TTX_DIR_NAME);

            // Convert the font file to ttx.
            let subscription = this.fontToolsService.convertTTFtoTTX(project.fontPath, ttxDirPath)
                .subscribe(
                    progress => {
                        // ttx Conversion Progress.
                        listener.next(((progress / 100) * 50) | 0);
                    },
                    err => {
                        Logger.logError("Could not convert to ttx: " + err, this);
                        listener.error("Extraction failed while converting font to ttx.");
                    },
                    () => {
                        // 50% Complete
                        listener.next(50);

                        // Create a directory for extraction.
                        let extractionPath = path.join(project.dataPath, ETConstants.PROJECT_EMOJI_EXTRACTION_DIR_NAME);
                        fs.removeSync(extractionPath);
                        fs.ensureDirSync(extractionPath);

                        // Start extracting

                        // Emoji Tools currently only supports cmap format 12.
                        this.cmapTableService.findSubtable(ttxDirPath, 12)
                            .then(cmapSubtable => {

                                switch (project.fontType) {
                                    case ETFontType.ANDROID:
                                        subscription = this.extractGoogleEmojis(extractionPath, ttxDirPath, cmapSubtable)
                                            .subscribe(
                                                progress => {
                                                    // Google Extraction Progress
                                                    listener.next((50 + ((progress / 100) * 50)) | 0);
                                                },
                                                err => {
                                                    Logger.logError("Could not extract emojis: " + err, this);
                                                    listener.error("Extraction was unsuccessful.");
                                                },
                                                () => {
                                                    // Assign the extraction path to the project.
                                                    project.extractionPath = extractionPath;

                                                    // Assign the ttx dir path to the project.
                                                    project.ttxDirPath = ttxDirPath;

                                                    // Save the project.
                                                    this.projectService.saveProject(project)
                                                        .subscribe(
                                                            project => {
                                                                // Done!
                                                                listener.next(100);
                                                                listener.complete();
                                                            },
                                                            err => {
                                                                Logger.logError("Could not save project after extraction: " + err, this);
                                                                listener.error("Could not save project after extraction.");
                                                            }
                                                        );
                                                }
                                            );
                                        break;
                                    case ETFontType.APPLE:
                                        subscription = this.extractAppleEmojis(extractionPath, ttxDirPath, cmapSubtable)
                                            .subscribe(
                                                progress => {
                                                    // Apple Extraction Progress
                                                    listener.next((50 + ((progress / 100) * 50)) | 0);
                                                },
                                                err => {
                                                    Logger.logError("Could not extract emojis: " + err, this);
                                                    listener.error("Extraction was unsuccessful.");
                                                },
                                                () => {
                                                    // Assign the extraction path to the project.
                                                    project.extractionPath = extractionPath;

                                                    // Assign the ttx dir path to the project.
                                                    project.ttxDirPath = ttxDirPath;

                                                    // Save the project.
                                                    this.projectService.saveProject(project)
                                                        .subscribe(
                                                            project => {
                                                                // Done!
                                                                listener.next(100);
                                                                listener.complete();
                                                            },
                                                            err => {
                                                                Logger.logError("Could not save project after extraction: " + err, this);
                                                                listener.error("Could not save project after extraction.");
                                                            }
                                                        );
                                                }
                                            );
                                        break;
                                    /*default:
                                     Logger.logError("Tried to extract emojis for an unsupported font type: " + ETFontType[project.fontType], this);
                                     listener.error("Support for this font type is not available.");*/
                                }
                            })
                            .catch(err => {
                                Logger.logError("Could not get subtable from cmap: " + err, this);
                                listener.error("Extraction failed while reading cmap table.");
                            });
                    }
                );

            return () => {
                subscription.unsubscribe();
            }
        });
    }

    /**
     * Extracts Emojis from a Google font.
     * @param extractionPath The path to extract emojis into.
     * @param ttxDirPath The path to the ttx directory.
     * @param cmapSubtable The cmap subtable for this font.
     * @returns An Observable that reports progress, 0 through 100.
     */
    private extractGoogleEmojis(extractionPath: string, ttxDirPath: string, cmapSubtable: ETcmapSubtable): Observable<number> {
        return Observable.create(listener => {
            // 0% complete.
            listener.next(0);

            // Glyph substitution makes up many of the final glyph names.
            this.GSUBTableService.extractLigatureSets(ttxDirPath)
                .then(
                    ligatureSetsAccessor => {
                        // Get the number of glyphs, for progress reporting.
                        this.CBDTTableService.determineNumberOfGlyphs(ttxDirPath)
                            .then(
                                numGlyphs => {
                                    Logger.logInfo("Extracting " + numGlyphs + " glyphs.", this);
                                    let currentImage = 0;

                                    // Android stores their images in the CBDT table.
                                    // Since it is so large, we read it as a stream - one image at a time.
                                    this.CBDTTableService.extractGlyphData(ttxDirPath)
                                        .subscribe(
                                            imageData => {
                                                currentImage++;

                                                Logger.logInfo("Extracting Glyph " + currentImage + " of " + numGlyphs + ": " + imageData.name, this);

                                                // Look for the glyph in the cmap table.
                                                if (cmapSubtable.names.includes(imageData.name)) {
                                                    // Create a file name from the code of the glyph.
                                                    let fileName = cmapSubtable.codes[cmapSubtable.names.indexOf(imageData.name)] + ".png";

                                                    // Write the image.
                                                    this.writeImageFile(imageData.imageData, path.join(extractionPath, fileName));
                                                }
                                                // If not found in cmap, look in GSUB.
                                                else if (ligatureSetsAccessor.ligaturesMap[imageData.name] != null) {
                                                    let ligature = ligatureSetsAccessor.ligaturesMap[imageData.name];
                                                    let glyphNames = [];

                                                    // Add the set's glyph first.
                                                    glyphNames.push(ligature.ligatureSet.glyphName);

                                                    // Then add all the components
                                                    glyphNames.push(...ligature.components);

                                                    // Convert names to codes, then join them with underscores and create a filename.
                                                    let fileName = glyphNames.map(name => cmapSubtable.codes[cmapSubtable.names.indexOf(name)]).join("_") + ".png";

                                                    // Write the image.
                                                    this.writeImageFile(imageData.imageData, path.join(extractionPath, fileName));
                                                }
                                                // If not found in either of those two, give up.
                                                else {
                                                    Logger.logError("Found a glyph with no cmap or GSUB record: " + imageData.name + ". Skipping...", this);
                                                }

                                                // Update progress.
                                                listener.next(((currentImage / numGlyphs) * 100) | 0);
                                            },
                                            err => {
                                                Logger.logError("Could not extract emojis: " + err, this);
                                                listener.error(err);
                                            },
                                            () => {
                                                // Complete
                                                listener.next(100);
                                                listener.complete();
                                            }
                                        );
                                }
                            )
                            .catch(
                                err => {
                                    Logger.logError("Could not determine number of glyphs in CBDT Table: " + err, this);
                                    listener.error("Could not determine the number of glyphs to extract.");
                                }
                            );
                    })
                .catch(
                    err => {
                        Logger.logError("Could not get ligature sets", this)
                    }
                );

        });
    }

    /**
     * Extracts Emojis from an Apple font.
     * @param extractionPath The path to extract emojis into.
     * @param ttxDirPath The path to the ttx directory.
     * @param cmapSubtable The cmap subtable for this font.
     * @returns An Observable that reports progress, 0 through 100.
     */
    private extractAppleEmojis(extractionPath: string, ttxDirPath: string, cmapSubtable: ETcmapSubtable): Observable<number> {
        return Observable.create(listener => {
            // 0% complete.
            listener.next(0);

            // Get the number of glyphs, for progress reporting.
            this.sbixTableService.determineNumberOfGlyphs(ttxDirPath)
                .then(
                    numGlyphs => {
                        Logger.logInfo("Extracting " + numGlyphs + " glyphs.", this);
                        let currentImage = 0;

                        // Apple stores their images in the sbix table.
                        // Since it is so large, we read it as a stream - one image at a time.
                        this.sbixTableService.extractGlyphData(ttxDirPath)
                            .subscribe(
                                imageData => {
                                    currentImage++;

                                    Logger.logInfo("Extracting Glyph " + currentImage + " of " + numGlyphs + ": " + imageData.name, this);

                                    // Look for the glyph in the cmap table.
                                    if (cmapSubtable.names.includes(imageData.name)) {
                                        // Create a file name from the code of the glyph.
                                        let fileName = cmapSubtable.codes[cmapSubtable.names.indexOf(imageData.name)] + ".png";

                                        // Write the image.
                                        this.writeImageFile(imageData.imageData, path.join(extractionPath, fileName));
                                    }
                                    /*// If not found in cmap, look in GSUB.
                                     else if (ligatureSetsAccessor.ligaturesMap[imageData.name] != null) {
                                     let ligature = ligatureSetsAccessor.ligaturesMap[imageData.name];
                                     let glyphNames = [];

                                     // Add the set's glyph first.
                                     glyphNames.push(ligature.ligatureSet.glyphName);

                                     // Then add all the components
                                     glyphNames.push(...ligature.components);

                                     // Convert names to codes, then join them with underscores and create a filename.
                                     let fileName = glyphNames.map(name => cmapSubtable.codes[cmapSubtable.names.indexOf(name)]).join("_") + ".png";

                                     // Write the image.
                                     this.writeImageFile(imageData.imageData, path.join(extractionPath, fileName));
                                     }*/
                                    // If not found in either of those two, give up.
                                    else {
                                        Logger.logError("Found a glyph with no cmap or morx record: " + imageData.name + ". Skipping...", this);
                                    }

                                    // Update progress.
                                    listener.next(((currentImage / numGlyphs) * 50) | 0);
                                },
                                err => {
                                    Logger.logError("Could not extract emojis: " + err, this);
                                    listener.error(err);
                                },
                                () => {
                                    // After extraction, convert from CgBI to RGBA
                                    this.CgBIService.convertCgBIToRGBA(extractionPath)
                                        .subscribe(
                                            progress => {
                                                // Update progress.
                                                listener.next((50 + (progress * 0.5)) | 0);
                                            },
                                            err => {
                                                Logger.logError("Could not convert from CgBI to RGBA: " + err, this);
                                                listener.error("Extraction failed while converting CgBI images to RGBA.");
                                            },
                                            () => {
                                                // Complete
                                                listener.next(100);
                                                listener.complete();
                                            }
                                        );
                                }
                            );
                    }
                )
                .catch(
                    err => {
                        Logger.logError("Could not determine number of glyphs in sbix Table: " + err, this);
                        listener.error("Could not determine the number of glyphs to extract.");
                    }
                );
        });
    }

    /**
     * Writes the image data to a file.
     * @param data The data to write.
     * @param outputPath The path to write to.
     */
    private writeImageFile(data: Uint8Array, outputPath: string) {
        fs.writeFileSync(outputPath, data);
    }

}