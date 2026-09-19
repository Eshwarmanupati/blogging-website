/*
    Renders the JSON that Editor.js produces. Each block type the editor can
    create needs a matching case here, otherwise it silently disappears from the
    published page.
*/

const Img = ({ url, caption }) => {
    return (
        <div>
            <img src={url} alt={caption || "blog image"} />
            {caption && caption.length ? (
                <p className="w-full text-center my-3 md:mb-12 text-base text-dark-grey">{caption}</p>
            ) : null}
        </div>
    );
};

const Quote = ({ quote, caption }) => {
    return (
        <div className="bg-purple/10 p-3 pl-5 border-l-4 border-purple">
            <p className="text-xl leading-10 md:text-2xl" dangerouslySetInnerHTML={{ __html: quote }}></p>
            {caption && caption.length ? <p className="w-full text-purple text-base">{caption}</p> : null}
        </div>
    );
};

const List = ({ style, items }) => {
    const ListTag = style === "ordered" ? "ol" : "ul";

    return (
        <ListTag className={"pl-5 " + (style === "ordered" ? "list-decimal" : "list-disc")}>
            {items.map((item, i) => {
                // Editor.js v2.30 nests list items as objects; older data is a plain string.
                const content = typeof item === "string" ? item : item.content;

                return (
                    <li key={i} className="my-4" dangerouslySetInnerHTML={{ __html: content }}></li>
                );
            })}
        </ListTag>
    );
};

const Code = ({ code }) => {
    return (
        <pre className="bg-grey p-5 rounded-md overflow-x-auto my-4">
            <code className="font-mono text-base leading-7 whitespace-pre">{code}</code>
        </pre>
    );
};

const Embed = ({ embed, caption, width, height }) => {
    return (
        <div className="my-4">
            <iframe
                src={embed}
                title={caption || "embedded content"}
                width={width || "100%"}
                height={height || 400}
                allowFullScreen
                className="w-full rounded-md"
            ></iframe>
            {caption && caption.length ? (
                <p className="w-full text-center my-3 text-base text-dark-grey">{caption}</p>
            ) : null}
        </div>
    );
};

const BlogContent = ({ block }) => {
    const { type, data } = block;

    if (type === "paragraph") {
        return <p dangerouslySetInnerHTML={{ __html: data.text }}></p>;
    }

    if (type === "header") {
        const Tag = `h${data.level}`;

        return <Tag className="font-bold" dangerouslySetInnerHTML={{ __html: data.text }}></Tag>;
    }

    if (type === "image") {
        return <Img url={data.file.url} caption={data.caption} />;
    }

    if (type === "quote") {
        return <Quote quote={data.text} caption={data.caption} />;
    }

    if (type === "list") {
        return <List style={data.style} items={data.items} />;
    }

    if (type === "code") {
        return <Code code={data.code} />;
    }

    if (type === "embed") {
        return <Embed embed={data.embed} caption={data.caption} width={data.width} height={data.height} />;
    }

    return null;
};

export default BlogContent;
