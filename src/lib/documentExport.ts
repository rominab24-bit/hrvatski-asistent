import jsPDF from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { saveAs } from 'file-saver';

type Block =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'p'; runs: { text: string; bold?: boolean; italic?: boolean }[] }
  | { kind: 'li'; runs: { text: string; bold?: boolean; italic?: boolean }[] };

function extractRuns(node: Node, bold = false, italic = false): { text: string; bold?: boolean; italic?: boolean }[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').replace(/\s+/g, ' ');
    if (!text.trim()) return [];
    return [{ text, bold, italic }];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const nextBold = bold || tag === 'strong' || tag === 'b';
  const nextItalic = italic || tag === 'em' || tag === 'i';
  const runs: { text: string; bold?: boolean; italic?: boolean }[] = [];
  el.childNodes.forEach((c) => runs.push(...extractRuns(c, nextBold, nextItalic)));
  return runs;
}

function collectBlocks(root: HTMLElement): Block[] {
  const blocks: Block[] = [];
  const walk = (el: HTMLElement) => {
    for (const child of Array.from(el.children)) {
      const c = child as HTMLElement;
      const tag = c.tagName.toLowerCase();
      if (tag === 'h1') blocks.push({ kind: 'h1', text: c.innerText.trim() });
      else if (tag === 'h2') blocks.push({ kind: 'h2', text: c.innerText.trim() });
      else if (tag === 'p') {
        const runs = extractRuns(c);
        if (runs.length) blocks.push({ kind: 'p', runs });
      } else if (tag === 'ul' || tag === 'ol') {
        for (const li of Array.from(c.querySelectorAll(':scope > li'))) {
          const runs = extractRuns(li);
          if (runs.length) blocks.push({ kind: 'li', runs });
        }
      } else if (c.children.length > 0) {
        walk(c);
      } else {
        const text = c.innerText?.trim();
        if (text) blocks.push({ kind: 'p', runs: [{ text }] });
      }
    }
  };
  walk(root);
  return blocks;
}

export async function exportToPdf(root: HTMLElement, title: string, filename: string) {
  const blocks = collectBlocks(root);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(title, maxWidth);
  ensureSpace(titleLines.length * 24);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 24 + 8;

  for (const b of blocks) {
    if (b.kind === 'h1') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      const lines = doc.splitTextToSize(b.text, maxWidth);
      ensureSpace(lines.length * 20 + 8);
      y += 8;
      doc.text(lines, margin, y);
      y += lines.length * 20;
    } else if (b.kind === 'h2') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      const lines = doc.splitTextToSize(b.text, maxWidth);
      ensureSpace(lines.length * 18 + 6);
      y += 6;
      doc.text(lines, margin, y);
      y += lines.length * 18;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const prefix = b.kind === 'li' ? '• ' : '';
      const text = prefix + b.runs.map((r) => r.text).join('');
      const indent = b.kind === 'li' ? 14 : 0;
      const lines = doc.splitTextToSize(text, maxWidth - indent);
      ensureSpace(lines.length * 15 + 4);
      y += 4;
      doc.text(lines, margin + indent, y);
      y += lines.length * 15;
    }
  }

  doc.save(filename);
}

export async function exportToDocx(root: HTMLElement, title: string, filename: string) {
  const blocks = collectBlocks(root);
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: title, bold: true, size: 40 })],
    }),
  ];

  for (const b of blocks) {
    if (b.kind === 'h1') {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: b.text, bold: true })] }));
    } else if (b.kind === 'h2') {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: b.text, bold: true })] }));
    } else if (b.kind === 'p') {
      children.push(new Paragraph({ spacing: { after: 120 }, children: b.runs.map((r) => new TextRun({ text: r.text, bold: r.bold, italics: r.italic })) }));
    } else {
      children.push(new Paragraph({ bullet: { level: 0 }, children: b.runs.map((r) => new TextRun({ text: r.text, bold: r.bold, italics: r.italic })) }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
