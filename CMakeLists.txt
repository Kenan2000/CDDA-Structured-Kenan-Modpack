# Cataclysm data files
cmake_minimum_required(VERSION 3.1.4)

SET(CATACLYSM_DATA_DIRS
    ${CMAKE_SOURCE_DIR}/Kenan-Modpack
)

IF(RELEASE)
    install(DIRECTORY ${CATACLYSM_DATA_DIRS} DESTINATION ${Kenan-Modpack_PREFIX})
    install(FILES ${CATACLYSM_DATA_FILES} DESTINATION $Kenan-Modpack_PREFIX})
ENDIF(RELEASE)
