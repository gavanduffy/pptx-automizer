# MCP Server Usage Examples

This document provides practical examples of using the pptx-automizer MCP server.

## Prerequisites

1. Build the project: `yarn build`
2. Prepare your PowerPoint templates with named elements
3. Have your media files ready in a directory

## Example 1: Simple Text Replacement

This example shows how to replace text placeholders in a template.

### Template Setup
In your PowerPoint template (`MyTemplate.pptx`), create a text box named `titleText` with the following content:
```
Welcome {{username}}!
This is {{company}}
```

### JSON Configuration
```json
{
  "templateDir": "./templates",
  "outputDir": "./output",
  "rootTemplate": "RootTemplate.pptx",
  "templates": [
    {
      "filename": "MyTemplate.pptx",
      "label": "main"
    }
  ],
  "slides": [
    {
      "template": "main",
      "slideNumber": 1,
      "textReplacements": [
        {
          "element": "titleText",
          "replacements": [
            {
              "tag": "username",
              "text": "John Doe"
            },
            {
              "tag": "company",
              "text": "Acme Corporation"
            }
          ]
        }
      ]
    }
  ],
  "outputFilename": "welcome.pptx",
  "removeExistingSlides": true
}
```

Result: A presentation with the text "Welcome John Doe! This is Acme Corporation"

## Example 2: Text with Custom Styling

Add visual emphasis with custom text styling.

### JSON Configuration
```json
{
  "templateDir": "./templates",
  "outputDir": "./output",
  "rootTemplate": "RootTemplate.pptx",
  "templates": [
    {
      "filename": "MyTemplate.pptx",
      "label": "main"
    }
  ],
  "slides": [
    {
      "template": "main",
      "slideNumber": 1,
      "textReplacements": [
        {
          "element": "titleText",
          "replacements": [
            {
              "tag": "title",
              "text": "Q4 Results",
              "style": {
                "size": 18000,
                "color": {
                  "type": "srgbClr",
                  "value": "FF0000"
                },
                "bold": true
              }
            },
            {
              "tag": "subtitle",
              "text": "Revenue Growth: +25%",
              "style": {
                "size": 14000,
                "color": {
                  "type": "srgbClr",
                  "value": "00AA00"
                },
                "italic": true
              }
            }
          ]
        }
      ]
    }
  ],
  "outputFilename": "q4-results.pptx"
}
```

## Example 3: Image Replacement

Replace placeholder images with actual media files.

### Template Setup
In your PowerPoint template, create an image and name it `companyLogo`.

### JSON Configuration
```json
{
  "templateDir": "./templates",
  "outputDir": "./output",
  "mediaDir": "./media",
  "rootTemplate": "RootTemplate.pptx",
  "templates": [
    {
      "filename": "MyTemplate.pptx",
      "label": "main"
    }
  ],
  "mediaFiles": ["acme-logo.png"],
  "slides": [
    {
      "template": "main",
      "slideNumber": 1,
      "imageReplacements": [
        {
          "element": "companyLogo",
          "mediaFile": "acme-logo.png"
        }
      ]
    }
  ],
  "outputFilename": "branded.pptx"
}
```

## Example 4: Multi-Slide Presentation

Create a presentation with multiple slides from different templates.

### JSON Configuration
```json
{
  "templateDir": "./templates",
  "outputDir": "./output",
  "mediaDir": "./media",
  "rootTemplate": "RootTemplate.pptx",
  "templates": [
    {
      "filename": "TitleSlide.pptx",
      "label": "title"
    },
    {
      "filename": "ContentSlide.pptx",
      "label": "content"
    },
    {
      "filename": "ChartSlide.pptx",
      "label": "chart"
    }
  ],
  "mediaFiles": ["logo.png", "team-photo.jpg"],
  "slides": [
    {
      "template": "title",
      "slideNumber": 1,
      "textReplacements": [
        {
          "element": "title",
          "replacements": [
            {
              "tag": "maintitle",
              "text": "2024 Annual Report"
            }
          ]
        }
      ],
      "imageReplacements": [
        {
          "element": "logo",
          "mediaFile": "logo.png"
        }
      ]
    },
    {
      "template": "content",
      "slideNumber": 1,
      "textReplacements": [
        {
          "element": "contentTitle",
          "replacements": [
            {
              "tag": "heading",
              "text": "Our Team"
            }
          ]
        }
      ],
      "imageReplacements": [
        {
          "element": "photoPlaceholder",
          "mediaFile": "team-photo.jpg"
        }
      ]
    },
    {
      "template": "chart",
      "slideNumber": 1,
      "textReplacements": [
        {
          "element": "chartTitle",
          "replacements": [
            {
              "tag": "title",
              "text": "Revenue Growth"
            }
          ]
        }
      ]
    }
  ],
  "outputFilename": "annual-report-2024.pptx",
  "removeExistingSlides": true
}
```

## Example 5: Dynamic Report Generation

Generate reports based on data - perfect for automated reporting.

### Use Case
Generate monthly sales reports with dynamic data.

### JSON Configuration (Template)
```json
{
  "templateDir": "./templates",
  "outputDir": "./reports",
  "rootTemplate": "RootTemplate.pptx",
  "templates": [
    {
      "filename": "SalesReport.pptx",
      "label": "sales"
    }
  ],
  "slides": [
    {
      "template": "sales",
      "slideNumber": 1,
      "textReplacements": [
        {
          "element": "reportTitle",
          "replacements": [
            {
              "tag": "month",
              "text": "January 2024"
            }
          ]
        },
        {
          "element": "metrics",
          "replacements": [
            {
              "tag": "revenue",
              "text": "$1,245,000"
            },
            {
              "tag": "growth",
              "text": "+15.3%"
            },
            {
              "tag": "customers",
              "text": "523"
            }
          ]
        }
      ]
    }
  ],
  "outputFilename": "sales-report-jan-2024.pptx"
}
```

In a real application, you would:
1. Fetch data from your database
2. Format the data as needed
3. Generate the JSON configuration dynamically
4. Call the MCP server tool with this configuration

## Testing Your Configuration

You can test your JSON configuration using the integration tests:

1. Place your templates in `__tests__/pptx-templates/`
2. Place your media in `__tests__/media/`
3. Create a test file similar to `__tests__/mcp-server-integration.test.ts`
4. Run: `yarn test your-test-name`

## Tips for Template Preparation

1. **Name Your Elements**: Use PowerPoint's Selection Pane (Alt+F10) to name shapes
2. **Use Consistent Tags**: Keep your `{{tag}}` names consistent across templates
3. **Test Incrementally**: Start with simple text replacements before adding images
4. **Check Element Names**: Verify element names in PowerPoint match your JSON exactly
5. **File Paths**: Use relative paths or absolute paths consistently

## Common Issues and Solutions

### Issue: "Template not found"
**Solution**: Verify the `templateDir` path and template filename are correct

### Issue: "Element not found"
**Solution**: Check that the element name in JSON matches the shape name in PowerPoint (use Selection Pane)

### Issue: "Image replacement fails"
**Solution**: Ensure:
- The media file exists in `mediaDir`
- The element is actually an image in the template
- The image format is supported (PNG, JPG, etc.)

### Issue: Output is missing content
**Solution**: Check that:
- `removeExistingSlides` is set correctly based on your needs
- All required templates are loaded
- Slide numbers are correct (1-based indexing)

## Integration with MCP Clients

To use this with an MCP client like Claude Desktop, add to your configuration:

```json
{
  "mcpServers": {
    "pptx-automizer": {
      "command": "node",
      "args": ["/absolute/path/to/pptx-automizer/dist/mcp/server.js"]
    }
  }
}
```

Then you can ask the AI assistant to generate presentations using natural language, and it will use the MCP server to create them.
