import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownTextProps = {
  text: string;
  sx?: SxProps<Theme>;
  typographySx?: SxProps<Theme>;
};

export default function MarkdownText({ text, sx, typographySx }: MarkdownTextProps) {
  return (
    <Box
      sx={{
        '& p': { m: 0, mb: 1 },
        '& p:last-child': { mb: 0 },
        '& ul, & ol': { pl: 2, my: 1 },
        '& li': { mb: 0.5 },
        ...sx,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          p: ({ children }) => (
            <Typography component="p" sx={typographySx}>
              {children}
            </Typography>
          ),
          li: ({ children }) => (
            <Typography component="li" sx={typographySx}>
              {children}
            </Typography>
          ),
          strong: ({ children }) => (
            <Box component="strong" sx={{ fontWeight: 700 }}>
              {children}
            </Box>
          ),
          em: ({ children }) => (
            <Box component="em" sx={{ fontStyle: 'italic' }}>
              {children}
            </Box>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </Box>
  );
}
