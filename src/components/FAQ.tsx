import React, { useState } from 'react';
import { ViewState } from '../types';
import { ChevronLeft, HelpCircle, FileText, Shield, ChevronDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { formatFaqAnswerMarkdown } from '../lib/faqEditor';

interface Props {
  onNavigate: (view: ViewState) => void;
}

export default function FAQ({ onNavigate }: Props) {
  const { content } = useData();
  const [openSections, setOpenSections] = useState<string[]>(content.faq.length > 0 ? [content.faq[0].id] : []);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Shared classes for markdown content to match the original design
  const markdownClasses = "pt-3 text-sm text-gray-600 leading-normal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:text-gray-800 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1";

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <div className="bg-white p-4 flex items-center justify-center shadow-md sticky top-0 z-10 relative">
        <button 
          onClick={() => onNavigate('home')}
          className="absolute left-4 p-2 -ml-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">FAQ и Правила</h1>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 pb-10">
        {/* FAQ Sections */}
        {content.faq.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <button 
              onClick={() => toggleSection(item.id)}
              className="w-full flex items-center p-5 text-left transition-colors hover:bg-gray-50"
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{item.question}</h2>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.includes(item.id) ? 'rotate-180' : ''}`} />
            </button>
            
            {openSections.includes(item.id) && (
              <div className="px-5 pb-5 pt-0 border-t border-gray-50 mt-2">
                <div className={markdownClasses}>
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{formatFaqAnswerMarkdown(item.answer)}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}

       
      </div>

      {/* Bottom Back Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 max-w-md mx-auto w-full">
        <button 
          onClick={() => onNavigate('home')} 
          className="w-full flex items-center justify-center gap-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] font-bold py-4 rounded-xl active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" /> Назад на главную
        </button>
      </div>
    </div>
  );
}
