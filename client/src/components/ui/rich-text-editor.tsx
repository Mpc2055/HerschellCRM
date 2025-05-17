import React, { useState, useEffect } from "react";
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface RichTextEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mergeTags?: { id: string; name: string; tag: string }[];
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Write something...",
  mergeTags = [],
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = () => {
    if (!linkUrl) return;

    if (linkUrl) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    }

    setLinkUrl("");
    setShowLinkForm(false);
  };

  const insertMergeTag = (tag: string) => {
    editor?.chain().focus().insertContent(tag).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200' : ''}
          type="button"
        >
          <i className="fas fa-bold"></i>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200' : ''}
          type="button"
        >
          <i className="fas fa-italic"></i>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-gray-200' : ''}
          type="button"
        >
          <i className="fas fa-underline"></i>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
          type="button"
        >
          H1
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
          type="button"
        >
          H2
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
          type="button"
        >
          <i className="fas fa-list-ul"></i>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
          type="button"
        >
          <i className="fas fa-list-ol"></i>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
          type="button"
        >
          <i className="fas fa-quote-left"></i>
        </Button>
        
        {showLinkForm ? (
          <div className="flex items-center gap-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-8 w-36"
            />
            <Button variant="outline" size="sm" onClick={setLink} type="button">
              <i className="fas fa-check"></i>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLinkForm(false)}
              type="button"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLinkUrl(editor.getAttributes('link').href || '');
              setShowLinkForm(true);
            }}
            className={editor.isActive('link') ? 'bg-gray-200' : ''}
            type="button"
          >
            <i className="fas fa-link"></i>
          </Button>
        )}
        
        {mergeTags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" type="button">
                <i className="fas fa-tags"></i> Merge Tags
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid gap-1">
                {mergeTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMergeTag(tag.tag)}
                    type="button"
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      <EditorContent editor={editor} className="p-4 min-h-[200px] prose max-w-none" />
    </div>
  );
}
