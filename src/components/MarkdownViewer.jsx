import ReactMarkdown from 'react-markdown';

export default function MarkdownViewer({ content }) {
    return (
        <div className="markdown-container">
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
}
