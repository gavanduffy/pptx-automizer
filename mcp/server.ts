#!/usr/bin/env node

/**
 * MCP Server for pptx-automizer
 * 
 * This MCP server allows JSON-based slideshow generation using pptx-automizer's
 * placeholder and image replacement capabilities.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create require function for CommonJS modules
const require = createRequire(import.meta.url);

// Import pptx-automizer from the parent dist directory
const Automizer = require(path.join(__dirname, '../index.js')).default;
const { modify } = require(path.join(__dirname, '../index.js'));

// Define the tool interface
const GENERATE_SLIDESHOW_TOOL: Tool = {
  name: 'generate_slideshow',
  description: `Generate a PowerPoint presentation from a template with dynamic content replacements.
  
This tool accepts JSON configuration for:
- Template selection
- Text placeholder replacements (using {{tag}} syntax)
- Image replacements
- Slide selection and ordering

The replacements are fully dynamic and passed via the JSON input, not hardcoded.`,
  inputSchema: {
    type: 'object',
    properties: {
      templateDir: {
        type: 'string',
        description: 'Directory containing template PPTX files',
      },
      outputDir: {
        type: 'string',
        description: 'Directory for output PPTX files',
      },
      mediaDir: {
        type: 'string',
        description: 'Optional directory containing media files for image replacements',
      },
      rootTemplate: {
        type: 'string',
        description: 'Root template PPTX filename',
      },
      templates: {
        type: 'array',
        description: 'Array of additional templates to load',
        items: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Template PPTX filename',
            },
            label: {
              type: 'string',
              description: 'Label to reference this template',
            },
          },
          required: ['filename', 'label'],
        },
      },
      mediaFiles: {
        type: 'array',
        description: 'Array of media files to load for image replacements',
        items: {
          type: 'string',
        },
      },
      slides: {
        type: 'array',
        description: 'Array of slides to add with modifications',
        items: {
          type: 'object',
          properties: {
            template: {
              type: 'string',
              description: 'Template label or filename',
            },
            slideNumber: {
              type: 'number',
              description: 'Slide number from template (1-based)',
            },
            textReplacements: {
              type: 'array',
              description: 'Text replacements for this slide',
              items: {
                type: 'object',
                properties: {
                  element: {
                    type: 'string',
                    description: 'Element name to modify',
                  },
                  replacements: {
                    type: 'array',
                    description: 'Tag-based replacements',
                    items: {
                      type: 'object',
                      properties: {
                        tag: {
                          type: 'string',
                          description: 'Tag to replace (without {{ }})',
                        },
                        text: {
                          type: 'string',
                          description: 'Replacement text',
                        },
                        style: {
                          type: 'object',
                          description: 'Optional text style',
                          properties: {
                            size: { type: 'number' },
                            color: {
                              type: 'object',
                              properties: {
                                type: { type: 'string' },
                                value: { type: 'string' },
                              },
                            },
                            bold: { type: 'boolean' },
                            italic: { type: 'boolean' },
                          },
                        },
                      },
                      required: ['tag', 'text'],
                    },
                  },
                },
                required: ['element', 'replacements'],
              },
            },
            imageReplacements: {
              type: 'array',
              description: 'Image replacements for this slide',
              items: {
                type: 'object',
                properties: {
                  element: {
                    type: 'string',
                    description: 'Image element name to modify',
                  },
                  mediaFile: {
                    type: 'string',
                    description: 'Media filename to use as replacement',
                  },
                },
                required: ['element', 'mediaFile'],
              },
            },
          },
          required: ['template', 'slideNumber'],
        },
      },
      outputFilename: {
        type: 'string',
        description: 'Output PPTX filename',
      },
      removeExistingSlides: {
        type: 'boolean',
        description: 'Whether to remove existing slides from root template (default: true)',
        default: true,
      },
    },
    required: ['templateDir', 'outputDir', 'rootTemplate', 'slides', 'outputFilename'],
  },
};

/**
 * Generate a slideshow based on JSON configuration
 */
async function generateSlideshow(args: Record<string, unknown>): Promise<{ success: boolean; message: string; outputPath?: string }> {
  try {
    // Validate required parameters
    if (!args.templateDir || !args.outputDir || !args.rootTemplate || !args.slides || !args.outputFilename) {
      return {
        success: false,
        message: 'Missing required parameters: templateDir, outputDir, rootTemplate, slides, and outputFilename are required',
      };
    }

    // Ensure directories exist
    if (!fs.existsSync(args.templateDir as string)) {
      return {
        success: false,
        message: `Template directory does not exist: ${args.templateDir}`,
      };
    }

    if (!fs.existsSync(args.outputDir as string)) {
      fs.mkdirSync(args.outputDir as string, { recursive: true });
    }

    // Create automizer instance
    const automizer = new Automizer({
      templateDir: args.templateDir,
      outputDir: args.outputDir,
      mediaDir: args.mediaDir || args.templateDir,
      removeExistingSlides: args.removeExistingSlides !== false,
      verbosity: 1,
    });

    // Load root template
    let pres = automizer.loadRoot(args.rootTemplate);

    // Load additional templates
    if (args.templates && Array.isArray(args.templates)) {
      for (const template of args.templates) {
        pres = pres.load(template.filename, template.label);
      }
    }

    // Load media files if specified
    if (args.mediaFiles && Array.isArray(args.mediaFiles)) {
      pres = pres.loadMedia(args.mediaFiles);
    }

    // Add slides with modifications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const slideConfig of args.slides as any[]) {
      pres = pres.addSlide(slideConfig.template, slideConfig.slideNumber, (slide) => {
        // Apply text replacements
        if (slideConfig.textReplacements && Array.isArray(slideConfig.textReplacements)) {
          for (const textReplacement of slideConfig.textReplacements) {
            const replacements = textReplacement.replacements.map((r: Record<string, unknown>) => ({
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

        // Apply image replacements
        if (slideConfig.imageReplacements && Array.isArray(slideConfig.imageReplacements)) {
          for (const imageReplacement of slideConfig.imageReplacements) {
            slide.modifyElement(imageReplacement.element, [
              modify.setRelationTarget(imageReplacement.mediaFile),
            ]);
          }
        }
      });
    }

    // Write output file
    await pres.write(args.outputFilename as string);
    const outputPath = path.join(args.outputDir as string, args.outputFilename as string);

    return {
      success: true,
      message: `Slideshow generated successfully. Output: ${outputPath}`,
      outputPath,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error generating slideshow: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Main server setup
 */
async function main() {
  const server = new Server(
    {
      name: 'pptx-automizer-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [GENERATE_SLIDESHOW_TOOL],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'generate_slideshow') {
      const result = await generateSlideshow(request.params.arguments);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: `Unknown tool: ${request.params.name}` }),
        },
      ],
      isError: true,
    };
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('pptx-automizer MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
