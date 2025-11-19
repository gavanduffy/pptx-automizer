# pptx-automizer MCP Server

This is a Model Context Protocol (MCP) server that provides a tool for generating PowerPoint presentations from templates using JSON-based configuration. The server leverages pptx-automizer's placeholder and image replacement capabilities.

## Features

- **Dynamic Text Replacement**: Replace placeholder text using `{{tag}}` syntax
- **Image Replacement**: Swap images in templates with new media files
- **Flexible Configuration**: All replacements are passed via JSON, nothing is hardcoded
- **Multiple Templates**: Load and combine multiple template files
- **Slide Management**: Select specific slides from templates and control ordering

## Installation

From the root of the pptx-automizer project:

```bash
# Install dependencies
yarn install

# Build the project (including MCP server)
yarn build
```

The MCP server will be built to `dist/mcp/server.js`.

## Configuration

The MCP server is configured to run as a standard MCP server using stdio transport. Add it to your MCP client configuration:

```json
{
  "mcpServers": {
    "pptx-automizer": {
      "command": "node",
      "args": ["/path/to/pptx-automizer/dist/mcp/server.js"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "pptx-automizer": {
      "command": "pptx-automizer-mcp"
    }
  }
}
```

## Available Tools

### generate_slideshow

Generate a PowerPoint presentation from a template with dynamic content replacements.

#### Parameters

- **templateDir** (required): Directory containing template PPTX files
- **outputDir** (required): Directory for output PPTX files
- **mediaDir** (optional): Directory containing media files for image replacements
- **rootTemplate** (required): Root template PPTX filename
- **templates** (optional): Array of additional templates to load
  - `filename`: Template PPTX filename
  - `label`: Label to reference this template
- **mediaFiles** (optional): Array of media files to load
- **slides** (required): Array of slides to add with modifications
  - `template`: Template label or filename
  - `slideNumber`: Slide number from template (1-based)
  - `textReplacements`: Array of text replacements
    - `element`: Element name to modify
    - `replacements`: Array of tag-based replacements
      - `tag`: Tag to replace (without `{{ }}`)
      - `text`: Replacement text
      - `style` (optional): Text style object
  - `imageReplacements`: Array of image replacements
    - `element`: Image element name to modify
    - `mediaFile`: Media filename to use as replacement
- **outputFilename** (required): Output PPTX filename
- **removeExistingSlides** (optional): Whether to remove existing slides from root template (default: true)

## Example Usage

Here's an example JSON configuration:

```json
{
  "templateDir": "./__tests__/pptx-templates",
  "outputDir": "./__tests__/pptx-output",
  "mediaDir": "./__tests__/media",
  "rootTemplate": "RootTemplate.pptx",
  "templates": [
    {
      "filename": "TextReplace.pptx",
      "label": "text"
    }
  ],
  "mediaFiles": [
    "feather.png",
    "test.png"
  ],
  "slides": [
    {
      "template": "text",
      "slideNumber": 1,
      "textReplacements": [
        {
          "element": "replaceText",
          "replacements": [
            {
              "tag": "replace",
              "text": "Dynamic Content"
            },
            {
              "tag": "by",
              "text": "Generated via MCP"
            },
            {
              "tag": "replacement",
              "text": "Success!",
              "style": {
                "size": 12000,
                "color": {
                  "type": "srgbClr",
                  "value": "00AA00"
                }
              }
            }
          ]
        }
      ]
    }
  ],
  "outputFilename": "mcp-generated.pptx",
  "removeExistingSlides": true
}
```

## Template Preparation

1. Create PowerPoint templates with placeholder text using `{{tagname}}` syntax
2. Name shapes/elements in PowerPoint (use Selection Pane: Alt+F10)
3. Place images that you want to replace and name them
4. Save templates in your template directory

## Testing the Server

You can test the server manually by running it and sending MCP protocol messages via stdin, or integrate it with an MCP client like Claude Desktop.

## Development

To rebuild the MCP server after making changes:

```bash
yarn build:mcp
```

To rebuild everything:

```bash
yarn build
```

## Troubleshooting

- **Template not found**: Ensure template files exist in the specified templateDir
- **Element not found**: Check that element names match those in your template (use PowerPoint Selection Pane to verify)
- **Image replacement fails**: Ensure media files exist in the mediaDir and are in supported formats (PNG, JPG, etc.)

## License

This MCP server is part of pptx-automizer and follows the same MIT license.
