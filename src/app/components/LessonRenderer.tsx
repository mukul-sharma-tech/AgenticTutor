// "use client";

// import React from "react";
// import { LiveProvider, LivePreview, LiveError } from "react-live";

// // Yeh scope hai jo generated component ko milega
// // React aur uske hooks explicitly provide karne padenge
// const scope = { 
//   React,
//   useState: React.useState,
//   useEffect: React.useEffect,
//   useCallback: React.useCallback,
//   useMemo: React.useMemo,
//   useRef: React.useRef
// };

// interface LessonRendererProps {
//   code: string;
// }

// const LessonRenderer: React.FC<LessonRendererProps> = ({ code }) => {
//   // AI generated code ko clean karte hain
//   // Remove any import statements because react-live doesn't support them
//   const cleanCode = code
//     .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '') // Remove all imports
//     .trim();

//   return (
//     <div className="w-full">
//       <LiveProvider
//         code={cleanCode}
//         scope={scope}
//         noInline={true}
//         theme={{
//           plain: {
//             backgroundColor: "#f9fafb",
//           },
//           styles: [],
//         }}
//       >
//         <LiveError 
//           className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 font-mono text-sm whitespace-pre-wrap"
//         />
        
//         <div className="border-2 border-gray-200 rounded-lg p-6 bg-white shadow-sm min-h-[200px]">
//           <LivePreview />
//         </div>
//       </LiveProvider>
//     </div>
//   );
// };

// export default LessonRenderer;



"use client";

import React from "react";
import { LiveProvider, LivePreview, LiveError } from "react-live";

// React scope for live rendering
const scope = { 
  React,
  useState: React.useState,
  useEffect: React.useEffect,
  useCallback: React.useCallback,
  useMemo: React.useMemo,
  useRef: React.useRef
};

interface LessonRendererProps {
  code: string;
}

const LessonRenderer: React.FC<LessonRendererProps> = ({ code }) => {
  // Clean up generated code (remove imports)
  const cleanCode = code
    .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, "")
    .trim();

  return (
    <div className="w-full bg-gray-50 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-3">
        Live Preview
      </h3>

      <LiveProvider
        code={cleanCode}
        scope={scope}
        noInline={true}
        theme={{
          plain: { backgroundColor: "#f9fafb" },
          styles: [],
        }}
      >
        <LiveError 
          className="bg-red-50 border border-red-200 text-red-700 p-3 sm:p-4 rounded-lg mb-3 font-mono text-xs sm:text-sm whitespace-pre-wrap"
        />

        <div className="border-2 border-gray-200 rounded-lg p-4 sm:p-6 bg-white shadow-sm min-h-[180px] sm:min-h-[200px] transition-all duration-300 ease-in-out overflow-x-auto">
          <LivePreview />
        </div>
      </LiveProvider>
    </div>
  );
};

export default LessonRenderer;
