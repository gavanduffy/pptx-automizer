import Automizer, { modify } from '../src/index';
import * as path from 'path';
import * as fs from 'fs';

/**
 * This test demonstrates the MCP server functionality by directly using
 * the same code that the MCP server would execute. It validates that
 * JSON-based configuration can be used to generate presentations with
 * dynamic text and image replacements.
 */

describe('MCP Server Integration', () => {
  const templateDir = path.join(__dirname, 'pptx-templates');
  const outputDir = path.join(__dirname, 'pptx-output');
  const mediaDir = path.join(__dirname, 'media');

  test('Generate slideshow with JSON config - text replacements', async () => {
    // This JSON structure matches what would be sent to the MCP server
    const config = {
      templateDir,
      outputDir,
      rootTemplate: 'RootTemplate.pptx',
      templates: [
        {
          filename: 'TextReplace.pptx',
          label: 'text',
        },
      ],
      slides: [
        {
          template: 'text',
          slideNumber: 1,
          textReplacements: [
            {
              element: 'replaceText',
              replacements: [
                {
                  tag: 'replace',
                  text: 'MCP Server',
                },
                {
                  tag: 'by',
                  text: 'JSON Config',
                },
                {
                  tag: 'replacement',
                  text: 'Dynamic Content',
                },
              ],
            },
          ],
        },
      ],
      outputFilename: 'mcp-integration-text.test.pptx',
      removeExistingSlides: true,
    };

    // Execute the same logic as the MCP server
    const automizer = new Automizer({
      templateDir: config.templateDir,
      outputDir: config.outputDir,
      removeExistingSlides: config.removeExistingSlides,
      verbosity: 0,
    });

    let pres = automizer.loadRoot(config.rootTemplate);

    // Load additional templates
    for (const template of config.templates) {
      pres = pres.load(template.filename, template.label);
    }

    // Add slides with modifications
    for (const slideConfig of config.slides) {
      pres = pres.addSlide(slideConfig.template, slideConfig.slideNumber, (slide) => {
        // Apply text replacements
        if (slideConfig.textReplacements) {
          for (const textReplacement of slideConfig.textReplacements) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const replacements = textReplacement.replacements.map((r: any) => ({
              replace: r.tag,
              by: r.style ? {
                text: r.text,
                style: r.style,
              } : {
                text: r.text,
              },
            }));

            slide.modifyElement(
              textReplacement.element,
              modify.replaceText(replacements, {
                openingTag: '{{',
                closingTag: '}}',
              })
            );
          }
        }
      });
    }

    const result = await pres.write(config.outputFilename);
    
    // Verify the output file was created
    const outputPath = path.join(outputDir, config.outputFilename);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    // Verify the result summary (we added 1 slide, total may include root template slide)
    expect(result.slides).toBeGreaterThanOrEqual(1);
  });

  test('Generate slideshow with JSON config - text and image replacements', async () => {
    const config = {
      templateDir,
      outputDir,
      mediaDir,
      rootTemplate: 'RootTemplate.pptx',
      templates: [
        {
          filename: 'SlideWithImages.pptx',
          label: 'images',
        },
      ],
      mediaFiles: ['feather.png', 'test.png'],
      slides: [
        {
          template: 'images',
          slideNumber: 2,
          imageReplacements: [
            {
              element: 'imagePNG',
              mediaFile: 'feather.png',
            },
          ],
        },
      ],
      outputFilename: 'mcp-integration-image.test.pptx',
      removeExistingSlides: true,
    };

    const automizer = new Automizer({
      templateDir: config.templateDir,
      outputDir: config.outputDir,
      mediaDir: config.mediaDir,
      removeExistingSlides: config.removeExistingSlides,
      verbosity: 0,
    });

    let pres = automizer.loadRoot(config.rootTemplate);

    // Load additional templates
    for (const template of config.templates) {
      pres = pres.load(template.filename, template.label);
    }

    // Load media files
    if (config.mediaFiles) {
      pres = pres.loadMedia(config.mediaFiles);
    }

    // Add slides with modifications
    for (const slideConfig of config.slides) {
      pres = pres.addSlide(slideConfig.template, slideConfig.slideNumber, (slide) => {
        // Apply image replacements
        if (slideConfig.imageReplacements) {
          for (const imageReplacement of slideConfig.imageReplacements) {
            slide.modifyElement(imageReplacement.element, [
              modify.setRelationTarget(imageReplacement.mediaFile),
            ]);
          }
        }
      });
    }

    const result = await pres.write(config.outputFilename);
    
    // Verify the output file was created
    const outputPath = path.join(outputDir, config.outputFilename);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    // Verify the result summary (we added 1 slide, total may include root template slide)
    expect(result.slides).toBeGreaterThanOrEqual(1);
    expect(result.images).toBeGreaterThan(0);
  });

  test('Generate slideshow with multiple slides and mixed replacements', async () => {
    const config = {
      templateDir,
      outputDir,
      mediaDir,
      rootTemplate: 'RootTemplate.pptx',
      templates: [
        {
          filename: 'TextReplace.pptx',
          label: 'text',
        },
        {
          filename: 'SlideWithImages.pptx',
          label: 'images',
        },
      ],
      mediaFiles: ['feather.png'],
      slides: [
        {
          template: 'text',
          slideNumber: 1,
          textReplacements: [
            {
              element: 'replaceText',
              replacements: [
                {
                  tag: 'replace',
                  text: 'Slide 1',
                },
                {
                  tag: 'by',
                  text: 'First Slide',
                },
                {
                  tag: 'replacement',
                  text: 'Content',
                },
              ],
            },
          ],
        },
        {
          template: 'images',
          slideNumber: 2,
          imageReplacements: [
            {
              element: 'imagePNG',
              mediaFile: 'feather.png',
            },
          ],
        },
      ],
      outputFilename: 'mcp-integration-multi.test.pptx',
      removeExistingSlides: true,
    };

    const automizer = new Automizer({
      templateDir: config.templateDir,
      outputDir: config.outputDir,
      mediaDir: config.mediaDir,
      removeExistingSlides: config.removeExistingSlides,
      verbosity: 0,
    });

    let pres = automizer.loadRoot(config.rootTemplate);

    for (const template of config.templates) {
      pres = pres.load(template.filename, template.label);
    }

    if (config.mediaFiles) {
      pres = pres.loadMedia(config.mediaFiles);
    }

    for (const slideConfig of config.slides) {
      pres = pres.addSlide(slideConfig.template, slideConfig.slideNumber, (slide) => {
        if (slideConfig.textReplacements) {
          for (const textReplacement of slideConfig.textReplacements) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const replacements = textReplacement.replacements.map((r: any) => ({
              replace: r.tag,
              by: { text: r.text },
            }));

            slide.modifyElement(
              textReplacement.element,
              modify.replaceText(replacements, {
                openingTag: '{{',
                closingTag: '}}',
              })
            );
          }
        }

        if (slideConfig.imageReplacements) {
          for (const imageReplacement of slideConfig.imageReplacements) {
            slide.modifyElement(imageReplacement.element, [
              modify.setRelationTarget(imageReplacement.mediaFile),
            ]);
          }
        }
      });
    }

    const result = await pres.write(config.outputFilename);
    
    const outputPath = path.join(outputDir, config.outputFilename);
    expect(fs.existsSync(outputPath)).toBe(true);
    // We added 2 slides, total may include root template slide
    expect(result.slides).toBeGreaterThanOrEqual(2);
  });
});
